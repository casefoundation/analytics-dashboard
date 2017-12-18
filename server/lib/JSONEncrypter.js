const crypto = require('crypto')
const algorithm = 'aes-256-ctr'
const password = process.env.SECRET
const zlib = require('zlib')

class JSONEncrypter {
  encrypt (object) {
    return new Promise((resolve, reject) => {
      const buffer = new Buffer(JSON.stringify(object), 'utf-8')
      const cipher = crypto.createCipher(algorithm, password)
      const crypted = Buffer.concat([cipher.update(buffer), cipher.final()])
      zlib.gzip(crypted, (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      })
    })
  }

  decrypt (buffer) {
    return new Promise((resolve, reject) => {
      zlib.gunzip(buffer, (err, result) => {
        if (err) {
          reject(err)
        } else {
          const decipher = crypto.createDecipher(algorithm, password)
          const dec = Buffer.concat([decipher.update(result), decipher.final()])
          const string = dec.toString('utf8')
          const obj = JSON.parse(string)
          resolve(obj)
        }
      })
    })
  }
}

module.exports = JSONEncrypter
