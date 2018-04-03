exports.randomInt = () => {
  return Math.floor(Math.random() * 10000)
}

exports.randomFloat = () => {
  return Math.floor(Math.random() * 1000000) / 100
}

exports.randomPercent = () => {
  return Math.floor(Math.random() * 100) + '%'
}

exports.randomFloatPercent = () => {
  return Math.random()
}

exports.randomSequence = (i) => {
  return (Math.sin(i) + 1) * Math.floor(Math.random() * 1000)
}
