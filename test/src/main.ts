const { msg: message } = require('./exports')

document.querySelector('#app')!.innerHTML = `
  <pre>
    ${message}
  </pre>
`
