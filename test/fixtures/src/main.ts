const { msg: message } = require('./exports')

// import { cjs } from './cjs'
import cjs from './cjs'

document.querySelector('#app')!.innerHTML = `
  <pre>
    ${message}
  </pre>
  <hr/>
  <pre>
    ${cjs.cjs}
  </pre>
`
