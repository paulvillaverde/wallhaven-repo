import React from 'react'

export default function ImageCard({ image = {}, onOpen = () => {} }) {
  const thumb = image?.thumbs?.small ?? image?.path ?? ''
  const alt = image?.id ?? 'wallpaper'
  return (
    <div className="image-card" onClick={onOpen} role="button" tabIndex={0}>
      {thumb ? <img src={thumb} alt={alt} /> : <div className="image-placeholder">No preview</div>}
      <div className="meta">{image?.resolution ?? 'Unknown'}</div>
    </div>
  )
}
