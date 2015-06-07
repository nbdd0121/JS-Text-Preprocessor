JavaScript Text Preprocessing / JavaScript Servlet Page
====

A very tiny JavaScript text preprocessor and a very simple JavaScript servlet page server.

If you use the text preprocessor, name your file .jstp<br/>
If you use the servlet page, name your file .jssp

The design requires you to use generator, so run node.js under harmony mode or use io.js

The syntax is simply <% xxx %> and <%= xxx %>. The former one will execute the code only and the latter one will output the result as well. <br/>
For the servlet page, make sure everything is async so the erver will not be blocked.`Async(function*(){ })` can create an async function, and within async function you can simple use `yield promise` to wait the promise until it finishes or throws. You can use async as well in text preprocessing mode but you can also use sync ones.

API
===

Async: Wrap the generator to make it returns a promise instead of a iterator<br/>
print: Print the first argument to stdout / client(if in servlet mode)<br/>
response/request: Node.js Request and Response object<br/>
require: Node.js require function

Others
===
Sublime text syntax highlighting is provided
