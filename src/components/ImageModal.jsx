import React from 'react'

export default function ImageModal({ image = {}, onClose = () => {} }) {
  const full = image?.path ?? image?.file ?? ''
  const openUrl = image?.short_url ?? '#'
  const sizeKB = image?.file_size ? `${Math.round(image.file_size / 1024)} KB` : 'N/A'

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="close" onClick={onClose}>×</button>
        {full ? <img src={full} alt={image?.id} /> : <div className="image-placeholder">No full image</div>}
        <div className="modal-meta">
          <a href={openUrl} target="_blank" rel="noreferrer">Open on Wallhaven</a>
          <div>Resolution: {image?.resolution ?? 'unknown'} • Size: {sizeKB}</div>
        </div>
      </div>
    </div>
  )
}
