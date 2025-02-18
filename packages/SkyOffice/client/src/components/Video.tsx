import React, { VideoHTMLAttributes, useEffect, useRef } from 'react'

//帮助开发者可以在React应用中轻松地显示实时视频流。
type PropsType = VideoHTMLAttributes<HTMLVideoElement> & {
  srcObject: MediaStream
}

export default function Video({ srcObject, ...props }: PropsType) {
  const refVideo = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!refVideo.current) return
    refVideo.current.srcObject = srcObject
  }, [srcObject])

  return <video ref={refVideo} {...props} />
}
