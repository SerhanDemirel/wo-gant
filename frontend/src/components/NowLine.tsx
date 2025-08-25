import { useEffect, useState } from 'react'

type Props = {
  scaleStart: Date
  pxPerMinute: number
  contentWidth: number
}

export default function NowLine({ scaleStart, pxPerMinute, contentWidth }: Props) {
  const [now, setNow] = useState<Date>(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60 * 1000)
    return () => clearInterval(id)
  }, [])

  const left = ((now.getTime() - scaleStart.getTime()) / 60000) * pxPerMinute
  if (left < 0 || left > contentWidth) return null
  return <div className="now-line" style={{ left: 120 + left }} />
}
