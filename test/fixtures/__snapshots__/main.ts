/* [vite-plugin-commonjs] import-hoist-S */ import * as __CJS__import__0__ from "./exports"; /* [vite-plugin-commonjs] import-hoist-E */const { msg: message } = (__CJS__import__0__.default || __CJS__import__0__);
import cjs from "./cjs";
document.querySelector("#app").innerHTML = `
  <pre>
    ${message}
  </pre>
  <hr/>
  <pre>
    ${cjs.cjs}
  </pre>
`;
