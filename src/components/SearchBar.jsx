import React, { useState } from 'react'

export default function SearchBar({ onSearch }) {
  const [value, setValue] = useState('')
  const submit = e => {
    e.preventDefault()
    onSearch?.(value.trim())
  }
  return (
    <form className="search-bar" onSubmit={submit} role="search">
      <input
        placeholder="Search wallpapers (e.g. nature, anime)"
        value={value}
        onChange={e => setValue(e.target.value)}
      />
      <button type="submit">Search</button>
    </form>
  )
}
