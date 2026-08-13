import { useEffect, useRef, useState } from 'react'
import type { 추천콜상세, 지도좌표 } from './carrierTypes'

interface KakaoLatLng {
  getLat(): number
  getLng(): number
}

interface KakaoMapInstance {
  setCenter(position: KakaoLatLng): void
}

interface KakaoMarker {
  setMap(map: KakaoMapInstance | null): void
  setPosition(position: KakaoLatLng): void
}

interface KakaoPolyline {
  setMap(map: KakaoMapInstance | null): void
}

interface KakaoOverlay {
  setMap(map: KakaoMapInstance | null): void
}

interface KakaoBounds {
  extend(position: KakaoLatLng): void
}

interface GeocodeResult { x: string; y: string }

interface KakaoSdk {
  maps: {
    load(callback: () => void): void
    Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number }) => KakaoMapInstance & { setBounds(bounds: KakaoBounds): void }
    LatLng: new (lat: number, lng: number) => KakaoLatLng
    LatLngBounds: new () => KakaoBounds
    Marker: new (options: { map: KakaoMapInstance; position: KakaoLatLng; title?: string }) => KakaoMarker
    Polyline: new (options: { map: KakaoMapInstance; path: KakaoLatLng[]; strokeWeight: number; strokeColor: string; strokeOpacity: number; strokeStyle: string }) => KakaoPolyline
    CustomOverlay: new (options: { map: KakaoMapInstance; position: KakaoLatLng; content: HTMLElement; yAnchor: number }) => KakaoOverlay
    services: {
      Status: { OK: string }
      Geocoder: new () => { addressSearch(address: string, callback: (result: GeocodeResult[], status: string) => void): void }
    }
  }
}

declare global {
  interface Window { kakao?: KakaoSdk }
}

let sdkPromise: Promise<KakaoSdk> | null = null

function loadKakaoSdk(key: string): Promise<KakaoSdk> {
  if (window.kakao?.maps) {
    return new Promise((resolve) => window.kakao?.maps.load(() => resolve(window.kakao as KakaoSdk)))
  }
  if (sdkPromise) return sdkPromise

  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&libraries=services&autoload=false`
    script.async = true
    script.dataset.movinKakaoMap = 'true'
    const timer = window.setTimeout(() => {
      sdkPromise = null
      script.remove()
      reject(new Error('KAKAO_SDK_TIMEOUT'))
    }, 8_000)
    script.addEventListener('load', () => {
      if (!window.kakao?.maps) {
        window.clearTimeout(timer)
        sdkPromise = null
        reject(new Error('KAKAO_SDK_MISSING'))
        return
      }
      window.kakao.maps.load(() => {
        window.clearTimeout(timer)
        resolve(window.kakao as KakaoSdk)
      })
    }, { once: true })
    script.addEventListener('error', () => {
      window.clearTimeout(timer)
      sdkPromise = null
      script.remove()
      reject(new Error('KAKAO_SDK_LOAD_FAILED'))
    }, { once: true })
    document.head.append(script)
  })
  return sdkPromise
}

function interpolate(start: 지도좌표, end: 지도좌표, progress: number): 지도좌표 {
  const ratio = Math.min(1, Math.max(0, progress / 100))
  return { lat: start.lat + (end.lat - start.lat) * ratio, lng: start.lng + (end.lng - start.lng) * ratio }
}

function labelElement(text: string, className: string): HTMLElement {
  const element = document.createElement('span')
  element.className = `kakao-map-label ${className}`
  element.textContent = text
  return element
}

function geocode(sdk: KakaoSdk, address: string): Promise<지도좌표> {
  return new Promise((resolve, reject) => {
    const geocoder = new sdk.maps.services.Geocoder()
    const timer = window.setTimeout(() => reject(new Error('GEOCODING_TIMEOUT')), 5_000)
    geocoder.addressSearch(address, (result, status) => {
      window.clearTimeout(timer)
      const first = result[0]
      if (status !== sdk.maps.services.Status.OK || !first) {
        reject(new Error('COORDINATE_NOT_FOUND'))
        return
      }
      resolve({ lat: Number(first.y), lng: Number(first.x) })
    })
  })
}

function FallbackMap({ reason }: { reason: string }) {
  return (
    <div className="carrier-route-map is-fallback" role="img" aria-label="지도 대체 경로 도식">
      <svg viewBox="0 0 340 230">
        <path className="street major" d="M-20 185C45 160 72 177 118 135S230 72 360 42" />
        <path className="street" d="M14 30C82 72 108 98 164 104s103-35 178-10M5 118c80-20 124 12 171 42s98 19 165 2" />
        <path className="route-shadow" d="M38 184C77 164 82 152 119 146c38-6 46-51 77-63 31-12 58 8 104-42" />
        <path className="route-line" d="M38 184C77 164 82 152 119 146c38-6 46-51 77-63 31-12 58 8 104-42" />
        <circle className="route-current" cx="38" cy="184" r="8" />
        <circle className="route-pickup" cx="119" cy="146" r="9" />
        <circle className="route-dropoff" cx="300" cy="41" r="9" />
      </svg>
      <span className="map-label current">현위치</span><span className="map-label pickup">상차</span><span className="map-label dropoff">하차</span>
      <p>{reason}</p>
    </div>
  )
}

export function KakaoRouteMap({ call, progress }: { call: 추천콜상세; progress: number }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const vehicleRef = useRef<KakaoMarker | null>(null)
  const sdkRef = useRef<KakaoSdk | null>(null)
  const pointsRef = useRef<{ start: 지도좌표; end: 지도좌표 } | null>(null)
  const progressRef = useRef(progress)
  const [retryCount, setRetryCount] = useState(0)
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback'>('loading')
  const [reason, setReason] = useState('')
  const key = import.meta.env.KAKAOMAP_API_KEY?.trim() ?? ''
  progressRef.current = progress

  useEffect(() => {
    let disposed = false
    const mapObjects: Array<KakaoMarker | KakaoPolyline | KakaoOverlay> = []
    setStatus('loading')
    setReason('')

    if (!key) {
      setStatus('fallback')
      setReason('지도 키가 없어 경로 요약으로 표시합니다. 운행은 계속할 수 있어요.')
      return
    }

    void loadKakaoSdk(key).then(async (sdk) => {
      const container = containerRef.current
      if (!container || disposed) return
      const start = call.출발좌표 ?? await geocode(sdk, call.출발지)
      const end = call.도착좌표 ?? await geocode(sdk, call.도착지)
      if (disposed) return

      const startLatLng = new sdk.maps.LatLng(start.lat, start.lng)
      const endLatLng = new sdk.maps.LatLng(end.lat, end.lng)
      const map = new sdk.maps.Map(container, { center: startLatLng, level: 8 })
      const bounds = new sdk.maps.LatLngBounds()
      bounds.extend(startLatLng)
      bounds.extend(endLatLng)
      map.setBounds(bounds)

      mapObjects.push(new sdk.maps.Polyline({ map, path: [startLatLng, endLatLng], strokeWeight: 6, strokeColor: '#347ce9', strokeOpacity: 0.9, strokeStyle: 'solid' }))
      mapObjects.push(new sdk.maps.Marker({ map, position: startLatLng, title: `상차 ${call.출발지}` }))
      mapObjects.push(new sdk.maps.Marker({ map, position: endLatLng, title: `하차 ${call.도착지}` }))
      mapObjects.push(new sdk.maps.CustomOverlay({ map, position: startLatLng, content: labelElement('상차', 'pickup'), yAnchor: 2.1 }))
      mapObjects.push(new sdk.maps.CustomOverlay({ map, position: endLatLng, content: labelElement('하차', 'dropoff'), yAnchor: 2.1 }))
      const vehiclePoint = interpolate(start, end, progressRef.current)
      const vehicle = new sdk.maps.Marker({ map, position: new sdk.maps.LatLng(vehiclePoint.lat, vehiclePoint.lng), title: '차량 진행 위치' })
      mapObjects.push(vehicle)
      vehicleRef.current = vehicle
      sdkRef.current = sdk
      pointsRef.current = { start, end }
      setStatus('ready')
    }).catch(() => {
      if (disposed) return
      setStatus('fallback')
      setReason('지도를 불러오지 못해 경로 요약으로 표시합니다. 다시 시도하거나 운행을 계속해 주세요.')
    })

    return () => {
      disposed = true
      mapObjects.forEach((item) => item.setMap(null))
      vehicleRef.current = null
      sdkRef.current = null
      pointsRef.current = null
    }
  }, [call.콜ID, call.도착지, call.도착좌표, call.출발지, call.출발좌표, key, retryCount])

  useEffect(() => {
    const sdk = sdkRef.current
    const points = pointsRef.current
    if (!sdk || !points || !vehicleRef.current) return
    const position = interpolate(points.start, points.end, progress)
    vehicleRef.current.setPosition(new sdk.maps.LatLng(position.lat, position.lng))
  }, [progress])

  if (status === 'fallback') {
    return <div><FallbackMap reason={reason} /><button type="button" className="carrier-map-retry" onClick={() => setRetryCount((count) => count + 1)}>지도 다시 불러오기</button></div>
  }

  return (
    <div className="carrier-route-map kakao-map-wrap" aria-label="Kakao 지도 운행 경로">
      <div ref={containerRef} className="kakao-map-canvas" />
      {status === 'loading' && <div className="carrier-map-loading" role="status">Kakao 지도를 불러오는 중…</div>}
    </div>
  )
}
