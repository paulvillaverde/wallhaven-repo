import React, { useState } from 'react'
import ImageCard from './ImageCard'
import ImageModal from './ImageModal'

export default function ImageGrid({ images = [], loading = false }) {
  const [selected, setSelected] = useState(null)
  if (loading) return <div className="loading">Loading...</div>
  const safeImages = Array.isArray(images) ? images : []
  if (!safeImages.length) return <div className="no-results">No results</div>

  return (
    <>
      <div className="image-grid">
        {safeImages.map((img, idx) => (
          <ImageCard key={img?.id ?? idx} image={img} onOpen={() => setSelected(img)} />
        ))}
      </div>
      {selected && <ImageModal image={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
