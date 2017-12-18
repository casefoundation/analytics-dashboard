require('./server')()
  .then((app) => {
    return new Promise((resolve, reject) => {
      app.listen(process.env.PORT || 8080, (err) => {
        if (err) {
          reject(err)
        } else {
          console.log('Server running')
          resolve()
        }
      })
    })
  })
  .catch((err) => {
    console.error(err)
    process.exit(-1)
  })
