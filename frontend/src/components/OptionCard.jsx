import React from 'react'
import { motion } from 'framer-motion'

const OptionCard = ({ option, index, onSelect, disabled }) => {
  const letter = option.split(')')[0].trim()
  const text = option.split(')', 1)[1]?.trim() || option

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => !disabled && onSelect(letter)}
      disabled={disabled}
      className="option-card text-left"
    >
      <div className="option-letter">{letter}</div>
      <span className="text-slate-100 font-medium">{text}</span>
    </motion.button>
  )
}

export default OptionCard