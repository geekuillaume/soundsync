
var Opus = (function() {
  var _scriptDir = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;
  if (typeof __filename !== 'undefined') _scriptDir = _scriptDir || __filename;
  return (
function(Opus) {
  Opus = Opus || {};

// Copyright 2010 The Emscripten Authors.  All rights reserved.
// Emscripten is available under two separate licenses, the MIT license and the
// University of Illinois/NCSA Open Source License.  Both these licenses can be
// found in the LICENSE file.

// The Module object: Our interface to the outside world. We import
// and export values on it. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to check if Module already exists (e.g. case 3 above).
// Substitution will be replaced with actual code on later stage of the build,
// this way Closure Compiler will not mangle it (e.g. case 4. above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module = typeof Opus !== 'undefined' ? Opus : {};

// --pre-jses are emitted after the Module integration code, so that they can
// refer to Module (if they choose; they can also define Module)
// {{PRE_JSES}}

// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
var key;
for (key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

var arguments_ = [];
var thisProgram = './this.program';
var quit_ = function(status, toThrow) {
  throw toThrow;
};

// Determine the runtime environment we are in. You can customize this by
// setting the ENVIRONMENT setting at compile time (see settings.js).

var ENVIRONMENT_IS_WEB = false;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = false;
var ENVIRONMENT_HAS_NODE = false;
var ENVIRONMENT_IS_SHELL = false;
ENVIRONMENT_IS_WEB = typeof window === 'object';
ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
// A web environment like Electron.js can have Node enabled, so we must
// distinguish between Node-enabled environments and Node environments per se.
// This will allow the former to do things like mount NODEFS.
// Extended check using process.versions fixes issue #8816.
// (Also makes redundant the original check that 'require' is a function.)
ENVIRONMENT_HAS_NODE = typeof process === 'object' && typeof process.versions === 'object' && typeof process.versions.node === 'string';
ENVIRONMENT_IS_NODE = ENVIRONMENT_HAS_NODE && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;
ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (Module['ENVIRONMENT']) {
  throw new Error('Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -s ENVIRONMENT=web or -s ENVIRONMENT=node)');
}



// `/` should be present at the end if `scriptDirectory` is not empty
var scriptDirectory = '';
function locateFile(path) {
  if (Module['locateFile']) {
    return Module['locateFile'](path, scriptDirectory);
  }
  return scriptDirectory + path;
}

// Hooks that are implemented differently in different runtime environments.
var read_,
    readAsync,
    readBinary,
    setWindowTitle;

var nodeFS;
var nodePath;

if (ENVIRONMENT_IS_NODE) {
  scriptDirectory = __dirname + '/';


  read_ = function shell_read(filename, binary) {
    var ret = tryParseAsDataURI(filename);
    if (ret) {
      return binary ? ret : ret.toString();
    }
    if (!nodeFS) nodeFS = require('fs');
    if (!nodePath) nodePath = require('path');
    filename = nodePath['normalize'](filename);
    return nodeFS['readFileSync'](filename, binary ? null : 'utf8');
  };

  readBinary = function readBinary(filename) {
    var ret = read_(filename, true);
    if (!ret.buffer) {
      ret = new Uint8Array(ret);
    }
    assert(ret.buffer);
    return ret;
  };




  if (process['argv'].length > 1) {
    thisProgram = process['argv'][1].replace(/\\/g, '/');
  }

  arguments_ = process['argv'].slice(2);

  // MODULARIZE will export the module in the proper place outside, we don't need to export here

  process['on']('uncaughtException', function(ex) {
    // suppress ExitStatus exceptions from showing an error
    if (!(ex instanceof ExitStatus)) {
      throw ex;
    }
  });

  process['on']('unhandledRejection', abort);

  quit_ = function(status) {
    process['exit'](status);
  };

  Module['inspect'] = function () { return '[Emscripten Module object]'; };



} else
if (ENVIRONMENT_IS_SHELL) {


  if (typeof read != 'undefined') {
    read_ = function shell_read(f) {
      var data = tryParseAsDataURI(f);
      if (data) {
        return intArrayToString(data);
      }
      return read(f);
    };
  }

  readBinary = function readBinary(f) {
    var data;
    data = tryParseAsDataURI(f);
    if (data) {
      return data;
    }
    if (typeof readbuffer === 'function') {
      return new Uint8Array(readbuffer(f));
    }
    data = read(f, 'binary');
    assert(typeof data === 'object');
    return data;
  };

  if (typeof scriptArgs != 'undefined') {
    arguments_ = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    arguments_ = arguments;
  }

  if (typeof quit === 'function') {
    quit_ = function(status) {
      quit(status);
    };
  }

  if (typeof print !== 'undefined') {
    // Prefer to use print/printErr where they exist, as they usually work better.
    if (typeof console === 'undefined') console = {};
    console.log = print;
    console.warn = console.error = typeof printErr !== 'undefined' ? printErr : print;
  }


} else

// Note that this includes Node.js workers when relevant (pthreads is enabled).
// Node.js workers are detected as a combination of ENVIRONMENT_IS_WORKER and
// ENVIRONMENT_HAS_NODE.
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  if (ENVIRONMENT_IS_WORKER) { // Check worker, not web, since window could be polyfilled
    scriptDirectory = self.location.href;
  } else if (document.currentScript) { // web
    scriptDirectory = document.currentScript.src;
  }
  // When MODULARIZE (and not _INSTANCE), this JS may be executed later, after document.currentScript
  // is gone, so we saved it, and we use it here instead of any other info.
  if (_scriptDir) {
    scriptDirectory = _scriptDir;
  }
  // blob urls look like blob:http://site.com/etc/etc and we cannot infer anything from them.
  // otherwise, slice off the final part of the url to find the script directory.
  // if scriptDirectory does not contain a slash, lastIndexOf will return -1,
  // and scriptDirectory will correctly be replaced with an empty string.
  if (scriptDirectory.indexOf('blob:') !== 0) {
    scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf('/')+1);
  } else {
    scriptDirectory = '';
  }


  // Differentiate the Web Worker from the Node Worker case, as reading must
  // be done differently.
  {


  read_ = function shell_read(url) {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, false);
      xhr.send(null);
      return xhr.responseText;
    } catch (err) {
      var data = tryParseAsDataURI(url);
      if (data) {
        return intArrayToString(data);
      }
      throw err;
    }
  };

  if (ENVIRONMENT_IS_WORKER) {
    readBinary = function readBinary(url) {
      try {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, false);
        xhr.responseType = 'arraybuffer';
        xhr.send(null);
        return new Uint8Array(xhr.response);
      } catch (err) {
        var data = tryParseAsDataURI(url);
        if (data) {
          return data;
        }
        throw err;
      }
    };
  }

  readAsync = function readAsync(url, onload, onerror) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function xhr_onload() {
      if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
        onload(xhr.response);
        return;
      }
      var data = tryParseAsDataURI(url);
      if (data) {
        onload(data.buffer);
        return;
      }
      onerror();
    };
    xhr.onerror = onerror;
    xhr.send(null);
  };




  }

  setWindowTitle = function(title) { document.title = title };
} else
{
  throw new Error('environment detection error');
}


// Set up the out() and err() hooks, which are how we can print to stdout or
// stderr, respectively.
var out = Module['print'] || console.log.bind(console);
var err = Module['printErr'] || console.warn.bind(console);

// Merge back in the overrides
for (key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
// Free the object hierarchy contained in the overrides, this lets the GC
// reclaim data used e.g. in memoryInitializerRequest, which is a large typed array.
moduleOverrides = null;

// Emit code to handle expected values on the Module object. This applies Module.x
// to the proper local x. This has two benefits: first, we only emit it if it is
// expected to arrive, and second, by using a local everywhere else that can be
// minified.
if (Module['arguments']) arguments_ = Module['arguments'];if (!Object.getOwnPropertyDescriptor(Module, 'arguments')) Object.defineProperty(Module, 'arguments', { configurable: true, get: function() { abort('Module.arguments has been replaced with plain arguments_') } });
if (Module['thisProgram']) thisProgram = Module['thisProgram'];if (!Object.getOwnPropertyDescriptor(Module, 'thisProgram')) Object.defineProperty(Module, 'thisProgram', { configurable: true, get: function() { abort('Module.thisProgram has been replaced with plain thisProgram') } });
if (Module['quit']) quit_ = Module['quit'];if (!Object.getOwnPropertyDescriptor(Module, 'quit')) Object.defineProperty(Module, 'quit', { configurable: true, get: function() { abort('Module.quit has been replaced with plain quit_') } });

// perform assertions in shell.js after we set up out() and err(), as otherwise if an assertion fails it cannot print the message
// Assertions on removed incoming Module JS APIs.
assert(typeof Module['memoryInitializerPrefixURL'] === 'undefined', 'Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['pthreadMainPrefixURL'] === 'undefined', 'Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['cdInitializerPrefixURL'] === 'undefined', 'Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['filePackagePrefixURL'] === 'undefined', 'Module.filePackagePrefixURL option was removed, use Module.locateFile instead');
assert(typeof Module['read'] === 'undefined', 'Module.read option was removed (modify read_ in JS)');
assert(typeof Module['readAsync'] === 'undefined', 'Module.readAsync option was removed (modify readAsync in JS)');
assert(typeof Module['readBinary'] === 'undefined', 'Module.readBinary option was removed (modify readBinary in JS)');
assert(typeof Module['setWindowTitle'] === 'undefined', 'Module.setWindowTitle option was removed (modify setWindowTitle in JS)');
if (!Object.getOwnPropertyDescriptor(Module, 'read')) Object.defineProperty(Module, 'read', { configurable: true, get: function() { abort('Module.read has been replaced with plain read_') } });
if (!Object.getOwnPropertyDescriptor(Module, 'readAsync')) Object.defineProperty(Module, 'readAsync', { configurable: true, get: function() { abort('Module.readAsync has been replaced with plain readAsync') } });
if (!Object.getOwnPropertyDescriptor(Module, 'readBinary')) Object.defineProperty(Module, 'readBinary', { configurable: true, get: function() { abort('Module.readBinary has been replaced with plain readBinary') } });
// TODO: add when SDL2 is fixed if (!Object.getOwnPropertyDescriptor(Module, 'setWindowTitle')) Object.defineProperty(Module, 'setWindowTitle', { configurable: true, get: function() { abort('Module.setWindowTitle has been replaced with plain setWindowTitle') } });
var IDBFS = 'IDBFS is no longer included by default; build with -lidbfs.js';
var PROXYFS = 'PROXYFS is no longer included by default; build with -lproxyfs.js';
var WORKERFS = 'WORKERFS is no longer included by default; build with -lworkerfs.js';
var NODEFS = 'NODEFS is no longer included by default; build with -lnodefs.js';


// TODO remove when SDL2 is fixed (also see above)



// Copyright 2017 The Emscripten Authors.  All rights reserved.
// Emscripten is available under two separate licenses, the MIT license and the
// University of Illinois/NCSA Open Source License.  Both these licenses can be
// found in the LICENSE file.

// {{PREAMBLE_ADDITIONS}}

var STACK_ALIGN = 16;

// stack management, and other functionality that is provided by the compiled code,
// should not be used before it is ready
stackSave = stackRestore = stackAlloc = function() {
  abort('cannot use the stack before compiled code is ready to run, and has provided stack access');
};

function staticAlloc(size) {
  abort('staticAlloc is no longer available at runtime; instead, perform static allocations at compile time (using makeStaticAlloc)');
}

function dynamicAlloc(size) {
  assert(DYNAMICTOP_PTR);
  var ret = HEAP32[DYNAMICTOP_PTR>>2];
  var end = (ret + size + 15) & -16;
  if (end > _emscripten_get_heap_size()) {
    abort('failure to dynamicAlloc - memory growth etc. is not supported there, call malloc/sbrk directly');
  }
  HEAP32[DYNAMICTOP_PTR>>2] = end;
  return ret;
}

function alignMemory(size, factor) {
  if (!factor) factor = STACK_ALIGN; // stack alignment (16-byte) by default
  return Math.ceil(size / factor) * factor;
}

function getNativeTypeSize(type) {
  switch (type) {
    case 'i1': case 'i8': return 1;
    case 'i16': return 2;
    case 'i32': return 4;
    case 'i64': return 8;
    case 'float': return 4;
    case 'double': return 8;
    default: {
      if (type[type.length-1] === '*') {
        return 4; // A pointer
      } else if (type[0] === 'i') {
        var bits = parseInt(type.substr(1));
        assert(bits % 8 === 0, 'getNativeTypeSize invalid bits ' + bits + ', type ' + type);
        return bits / 8;
      } else {
        return 0;
      }
    }
  }
}

function warnOnce(text) {
  if (!warnOnce.shown) warnOnce.shown = {};
  if (!warnOnce.shown[text]) {
    warnOnce.shown[text] = 1;
    err(text);
  }
}






// Wraps a JS function as a wasm function with a given signature.
function convertJsFunctionToWasm(func, sig) {

  // If the type reflection proposal is available, use the new
  // "WebAssembly.Function" constructor.
  // Otherwise, construct a minimal wasm module importing the JS function and
  // re-exporting it.
  if (typeof WebAssembly.Function === "function") {
    var typeNames = {
      'i': 'i32',
      'j': 'i64',
      'f': 'f32',
      'd': 'f64'
    };
    var type = {
      parameters: [],
      results: sig[0] == 'v' ? [] : [typeNames[sig[0]]]
    };
    for (var i = 1; i < sig.length; ++i) {
      type.parameters.push(typeNames[sig[i]]);
    }
    return new WebAssembly.Function(type, func);
  }

  // The module is static, with the exception of the type section, which is
  // generated based on the signature passed in.
  var typeSection = [
    0x01, // id: section,
    0x00, // length: 0 (placeholder)
    0x01, // count: 1
    0x60, // form: func
  ];
  var sigRet = sig.slice(0, 1);
  var sigParam = sig.slice(1);
  var typeCodes = {
    'i': 0x7f, // i32
    'j': 0x7e, // i64
    'f': 0x7d, // f32
    'd': 0x7c, // f64
  };

  // Parameters, length + signatures
  typeSection.push(sigParam.length);
  for (var i = 0; i < sigParam.length; ++i) {
    typeSection.push(typeCodes[sigParam[i]]);
  }

  // Return values, length + signatures
  // With no multi-return in MVP, either 0 (void) or 1 (anything else)
  if (sigRet == 'v') {
    typeSection.push(0x00);
  } else {
    typeSection = typeSection.concat([0x01, typeCodes[sigRet]]);
  }

  // Write the overall length of the type section back into the section header
  // (excepting the 2 bytes for the section id and length)
  typeSection[1] = typeSection.length - 2;

  // Rest of the module is static
  var bytes = new Uint8Array([
    0x00, 0x61, 0x73, 0x6d, // magic ("\0asm")
    0x01, 0x00, 0x00, 0x00, // version: 1
  ].concat(typeSection, [
    0x02, 0x07, // import section
      // (import "e" "f" (func 0 (type 0)))
      0x01, 0x01, 0x65, 0x01, 0x66, 0x00, 0x00,
    0x07, 0x05, // export section
      // (export "f" (func 0 (type 0)))
      0x01, 0x01, 0x66, 0x00, 0x00,
  ]));

   // We can compile this wasm module synchronously because it is very small.
  // This accepts an import (at "e.f"), that it reroutes to an export (at "f")
  var module = new WebAssembly.Module(bytes);
  var instance = new WebAssembly.Instance(module, {
    'e': {
      'f': func
    }
  });
  var wrappedFunc = instance.exports['f'];
  return wrappedFunc;
}

// Add a wasm function to the table.
function addFunctionWasm(func, sig) {
  var table = wasmTable;
  var ret = table.length;

  // Grow the table
  try {
    table.grow(1);
  } catch (err) {
    if (!(err instanceof RangeError)) {
      throw err;
    }
    throw 'Unable to grow wasm table. Use a higher value for RESERVED_FUNCTION_POINTERS or set ALLOW_TABLE_GROWTH.';
  }

  // Insert new element
  try {
    // Attempting to call this with JS function will cause of table.set() to fail
    table.set(ret, func);
  } catch (err) {
    if (!(err instanceof TypeError)) {
      throw err;
    }
    assert(typeof sig !== 'undefined', 'Missing signature argument to addFunction');
    var wrapped = convertJsFunctionToWasm(func, sig);
    table.set(ret, wrapped);
  }

  return ret;
}

function removeFunctionWasm(index) {
  // TODO(sbc): Look into implementing this to allow re-using of table slots
}

// 'sig' parameter is required for the llvm backend but only when func is not
// already a WebAssembly function.
function addFunction(func, sig) {
  assert(typeof func !== 'undefined');

  return addFunctionWasm(func, sig);
}

function removeFunction(index) {
  removeFunctionWasm(index);
}



var funcWrappers = {};

function getFuncWrapper(func, sig) {
  if (!func) return; // on null pointer, return undefined
  assert(sig);
  if (!funcWrappers[sig]) {
    funcWrappers[sig] = {};
  }
  var sigCache = funcWrappers[sig];
  if (!sigCache[func]) {
    // optimize away arguments usage in common cases
    if (sig.length === 1) {
      sigCache[func] = function dynCall_wrapper() {
        return dynCall(sig, func);
      };
    } else if (sig.length === 2) {
      sigCache[func] = function dynCall_wrapper(arg) {
        return dynCall(sig, func, [arg]);
      };
    } else {
      // general case
      sigCache[func] = function dynCall_wrapper() {
        return dynCall(sig, func, Array.prototype.slice.call(arguments));
      };
    }
  }
  return sigCache[func];
}


function makeBigInt(low, high, unsigned) {
  return unsigned ? ((+((low>>>0)))+((+((high>>>0)))*4294967296.0)) : ((+((low>>>0)))+((+((high|0)))*4294967296.0));
}

function dynCall(sig, ptr, args) {
  if (args && args.length) {
    // j (64-bit integer) must be passed in as two numbers [low 32, high 32].
    assert(args.length === sig.substring(1).replace(/j/g, '--').length);
    assert(('dynCall_' + sig) in Module, 'bad function pointer type - no table for sig \'' + sig + '\'');
    return Module['dynCall_' + sig].apply(null, [ptr].concat(args));
  } else {
    assert(sig.length == 1);
    assert(('dynCall_' + sig) in Module, 'bad function pointer type - no table for sig \'' + sig + '\'');
    return Module['dynCall_' + sig].call(null, ptr);
  }
}

var tempRet0 = 0;

var setTempRet0 = function(value) {
  tempRet0 = value;
};

var getTempRet0 = function() {
  return tempRet0;
};

function getCompilerSetting(name) {
  throw 'You must build with -s RETAIN_COMPILER_SETTINGS=1 for getCompilerSetting or emscripten_get_compiler_setting to work';
}

var Runtime = {
  // helpful errors
  getTempRet0: function() { abort('getTempRet0() is now a top-level function, after removing the Runtime object. Remove "Runtime."') },
  staticAlloc: function() { abort('staticAlloc() is now a top-level function, after removing the Runtime object. Remove "Runtime."') },
  stackAlloc: function() { abort('stackAlloc() is now a top-level function, after removing the Runtime object. Remove "Runtime."') },
};

// The address globals begin at. Very low in memory, for code size and optimization opportunities.
// Above 0 is static memory, starting with globals.
// Then the stack.
// Then 'dynamic' memory for sbrk.
var GLOBAL_BASE = 1024;




// === Preamble library stuff ===

// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html


var wasmBinary;if (Module['wasmBinary']) wasmBinary = Module['wasmBinary'];if (!Object.getOwnPropertyDescriptor(Module, 'wasmBinary')) Object.defineProperty(Module, 'wasmBinary', { configurable: true, get: function() { abort('Module.wasmBinary has been replaced with plain wasmBinary') } });
var noExitRuntime;if (Module['noExitRuntime']) noExitRuntime = Module['noExitRuntime'];if (!Object.getOwnPropertyDescriptor(Module, 'noExitRuntime')) Object.defineProperty(Module, 'noExitRuntime', { configurable: true, get: function() { abort('Module.noExitRuntime has been replaced with plain noExitRuntime') } });


if (typeof WebAssembly !== 'object') {
  abort('No WebAssembly support found. Build with -s WASM=0 to target JavaScript instead.');
}


// In MINIMAL_RUNTIME, setValue() and getValue() are only available when building with safe heap enabled, for heap safety checking.
// In traditional runtime, setValue() and getValue() are always available (although their use is highly discouraged due to perf penalties)

/** @type {function(number, number, string, boolean=)} */
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[((ptr)>>0)]=value; break;
      case 'i8': HEAP8[((ptr)>>0)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}

/** @type {function(number, string, boolean=)} */
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[((ptr)>>0)];
      case 'i8': return HEAP8[((ptr)>>0)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for getValue: ' + type);
    }
  return null;
}





// Wasm globals

var wasmMemory;

// In fastcomp asm.js, we don't need a wasm Table at all.
// In the wasm backend, we polyfill the WebAssembly object,
// so this creates a (non-native-wasm) table for us.
var wasmTable = new WebAssembly.Table({
  'initial': 1,
  'maximum': 1 + 0,
  'element': 'anyfunc'
});


//========================================
// Runtime essentials
//========================================

// whether we are quitting the application. no code should run after this.
// set in exit() and abort()
var ABORT = false;

// set by exit() and abort().  Passed to 'onExit' handler.
// NOTE: This is also used as the process return code code in shell environments
// but only when noExitRuntime is false.
var EXITSTATUS = 0;

/** @type {function(*, string=)} */
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  var func = Module['_' + ident]; // closure exported function
  assert(func, 'Cannot call unknown function ' + ident + ', make sure it is exported');
  return func;
}

// C calling interface.
function ccall(ident, returnType, argTypes, args, opts) {
  // For fast lookup of conversion functions
  var toC = {
    'string': function(str) {
      var ret = 0;
      if (str !== null && str !== undefined && str !== 0) { // null string
        // at most 4 bytes per UTF-8 code point, +1 for the trailing '\0'
        var len = (str.length << 2) + 1;
        ret = stackAlloc(len);
        stringToUTF8(str, ret, len);
      }
      return ret;
    },
    'array': function(arr) {
      var ret = stackAlloc(arr.length);
      writeArrayToMemory(arr, ret);
      return ret;
    }
  };

  function convertReturnValue(ret) {
    if (returnType === 'string') return UTF8ToString(ret);
    if (returnType === 'boolean') return Boolean(ret);
    return ret;
  }

  var func = getCFunc(ident);
  var cArgs = [];
  var stack = 0;
  assert(returnType !== 'array', 'Return type should not be "array".');
  if (args) {
    for (var i = 0; i < args.length; i++) {
      var converter = toC[argTypes[i]];
      if (converter) {
        if (stack === 0) stack = stackSave();
        cArgs[i] = converter(args[i]);
      } else {
        cArgs[i] = args[i];
      }
    }
  }
  var ret = func.apply(null, cArgs);

  ret = convertReturnValue(ret);
  if (stack !== 0) stackRestore(stack);
  return ret;
}

function cwrap(ident, returnType, argTypes, opts) {
  return function() {
    return ccall(ident, returnType, argTypes, arguments, opts);
  }
}

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_DYNAMIC = 2; // Cannot be freed except through sbrk
var ALLOC_NONE = 3; // Do not allocate

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
/** @type {function((TypedArray|Array<number>|number), string, number, number=)} */
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc,
    stackAlloc,
    dynamicAlloc][allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
    var stop;
    ptr = ret;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)>>0)]=0;
    }
    return ret;
  }

  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(/** @type {!Uint8Array} */ (slab), ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }

  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    assert(type, 'Must know what type to store in allocate!');

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);

    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }

  return ret;
}

// Allocate memory during any stage of startup - static memory early on, dynamic memory later, malloc when ready
function getMemory(size) {
  if (!runtimeInitialized) return dynamicAlloc(size);
  return _malloc(size);
}


// runtime_strings.js: Strings related runtime functions that are part of both MINIMAL_RUNTIME and regular runtime.

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the given array that contains uint8 values, returns
// a copy of that string as a Javascript String object.

var UTF8Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf8') : undefined;

/**
 * @param {number} idx
 * @param {number=} maxBytesToRead
 * @return {string}
 */
function UTF8ArrayToString(u8Array, idx, maxBytesToRead) {
  var endIdx = idx + maxBytesToRead;
  var endPtr = idx;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
  // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
  // (As a tiny code save trick, compare endPtr against endIdx using a negation, so that undefined means Infinity)
  while (u8Array[endPtr] && !(endPtr >= endIdx)) ++endPtr;

  if (endPtr - idx > 16 && u8Array.subarray && UTF8Decoder) {
    return UTF8Decoder.decode(u8Array.subarray(idx, endPtr));
  } else {
    var str = '';
    // If building with TextDecoder, we have already computed the string length above, so test loop end condition against that
    while (idx < endPtr) {
      // For UTF8 byte structure, see:
      // http://en.wikipedia.org/wiki/UTF-8#Description
      // https://www.ietf.org/rfc/rfc2279.txt
      // https://tools.ietf.org/html/rfc3629
      var u0 = u8Array[idx++];
      if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
      var u1 = u8Array[idx++] & 63;
      if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
      var u2 = u8Array[idx++] & 63;
      if ((u0 & 0xF0) == 0xE0) {
        u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
      } else {
        if ((u0 & 0xF8) != 0xF0) warnOnce('Invalid UTF-8 leading byte 0x' + u0.toString(16) + ' encountered when deserializing a UTF-8 string on the asm.js/wasm heap to a JS string!');
        u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (u8Array[idx++] & 63);
      }

      if (u0 < 0x10000) {
        str += String.fromCharCode(u0);
      } else {
        var ch = u0 - 0x10000;
        str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
      }
    }
  }
  return str;
}

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the emscripten HEAP, returns a
// copy of that string as a Javascript String object.
// maxBytesToRead: an optional length that specifies the maximum number of bytes to read. You can omit
//                 this parameter to scan the string until the first \0 byte. If maxBytesToRead is
//                 passed, and the string at [ptr, ptr+maxBytesToReadr[ contains a null byte in the
//                 middle, then the string will cut short at that byte index (i.e. maxBytesToRead will
//                 not produce a string of exact length [ptr, ptr+maxBytesToRead[)
//                 N.B. mixing frequent uses of UTF8ToString() with and without maxBytesToRead may
//                 throw JS JIT optimizations off, so it is worth to consider consistently using one
//                 style or the other.
/**
 * @param {number} ptr
 * @param {number=} maxBytesToRead
 * @return {string}
 */
function UTF8ToString(ptr, maxBytesToRead) {
  return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : '';
}

// Copies the given Javascript String object 'str' to the given byte array at address 'outIdx',
// encoded in UTF8 form and null-terminated. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outU8Array: the array to copy to. Each index in this array is assumed to be one 8-byte element.
//   outIdx: The starting offset in the array to begin the copying.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array.
//                    This count should include the null terminator,
//                    i.e. if maxBytesToWrite=1, only the null terminator will be written and nothing else.
//                    maxBytesToWrite=0 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
  if (!(maxBytesToWrite > 0)) // Parameter maxBytesToWrite is not optional. Negative values, 0, null, undefined and false each don't write out any bytes.
    return 0;

  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) {
      var u1 = str.charCodeAt(++i);
      u = 0x10000 + ((u & 0x3FF) << 10) | (u1 & 0x3FF);
    }
    if (u <= 0x7F) {
      if (outIdx >= endIdx) break;
      outU8Array[outIdx++] = u;
    } else if (u <= 0x7FF) {
      if (outIdx + 1 >= endIdx) break;
      outU8Array[outIdx++] = 0xC0 | (u >> 6);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0xFFFF) {
      if (outIdx + 2 >= endIdx) break;
      outU8Array[outIdx++] = 0xE0 | (u >> 12);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else {
      if (outIdx + 3 >= endIdx) break;
      if (u >= 0x200000) warnOnce('Invalid Unicode code point 0x' + u.toString(16) + ' encountered when serializing a JS string to an UTF-8 string on the asm.js/wasm heap! (Valid unicode code points should be in range 0-0x1FFFFF).');
      outU8Array[outIdx++] = 0xF0 | (u >> 18);
      outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    }
  }
  // Null-terminate the pointer to the buffer.
  outU8Array[outIdx] = 0;
  return outIdx - startIdx;
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF8 form. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8 to compute the exact number of bytes (excluding null terminator) that this function will write.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8(str, outPtr, maxBytesToWrite) {
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  return stringToUTF8Array(str, HEAPU8,outPtr, maxBytesToWrite);
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF8 byte array, EXCLUDING the null terminator byte.
function lengthBytesUTF8(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) u = 0x10000 + ((u & 0x3FF) << 10) | (str.charCodeAt(++i) & 0x3FF);
    if (u <= 0x7F) ++len;
    else if (u <= 0x7FF) len += 2;
    else if (u <= 0xFFFF) len += 3;
    else len += 4;
  }
  return len;
}



// runtime_strings_extra.js: Strings related runtime functions that are available only in regular runtime.

// Given a pointer 'ptr' to a null-terminated ASCII-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

function AsciiToString(ptr) {
  var str = '';
  while (1) {
    var ch = HEAPU8[((ptr++)>>0)];
    if (!ch) return str;
    str += String.fromCharCode(ch);
  }
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in ASCII form. The copy will require at most str.length+1 bytes of space in the HEAP.

function stringToAscii(str, outPtr) {
  return writeAsciiToMemory(str, outPtr, false);
}

// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

var UTF16Decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-16le') : undefined;

function UTF16ToString(ptr) {
  assert(ptr % 2 == 0, 'Pointer passed to UTF16ToString must be aligned to two bytes!');
  var endPtr = ptr;
  // TextDecoder needs to know the byte length in advance, it doesn't stop on null terminator by itself.
  // Also, use the length info to avoid running tiny strings through TextDecoder, since .subarray() allocates garbage.
  var idx = endPtr >> 1;
  while (HEAP16[idx]) ++idx;
  endPtr = idx << 1;

  if (endPtr - ptr > 32 && UTF16Decoder) {
    return UTF16Decoder.decode(HEAPU8.subarray(ptr, endPtr));
  } else {
    var i = 0;

    var str = '';
    while (1) {
      var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
      if (codeUnit == 0) return str;
      ++i;
      // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
      str += String.fromCharCode(codeUnit);
    }
  }
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16 form. The copy will require at most str.length*4+2 bytes of space in the HEAP.
// Use the function lengthBytesUTF16() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
//                    terminator, i.e. if maxBytesToWrite=2, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<2 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF16(str, outPtr, maxBytesToWrite) {
  assert(outPtr % 2 == 0, 'Pointer passed to stringToUTF16 must be aligned to two bytes!');
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF16(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  if (maxBytesToWrite < 2) return 0;
  maxBytesToWrite -= 2; // Null terminator.
  var startPtr = outPtr;
  var numCharsToWrite = (maxBytesToWrite < str.length*2) ? (maxBytesToWrite / 2) : str.length;
  for (var i = 0; i < numCharsToWrite; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[((outPtr)>>1)]=codeUnit;
    outPtr += 2;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[((outPtr)>>1)]=0;
  return outPtr - startPtr;
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF16(str) {
  return str.length*2;
}

function UTF32ToString(ptr) {
  assert(ptr % 4 == 0, 'Pointer passed to UTF32ToString must be aligned to four bytes!');
  var i = 0;

  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32 form. The copy will require at most str.length*4+4 bytes of space in the HEAP.
// Use the function lengthBytesUTF32() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null
//                    terminator, i.e. if maxBytesToWrite=4, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<4 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF32(str, outPtr, maxBytesToWrite) {
  assert(outPtr % 4 == 0, 'Pointer passed to stringToUTF32 must be aligned to four bytes!');
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF32(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  if (maxBytesToWrite < 4) return 0;
  var startPtr = outPtr;
  var endPtr = startPtr + maxBytesToWrite - 4;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++i);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[((outPtr)>>2)]=codeUnit;
    outPtr += 4;
    if (outPtr + 4 > endPtr) break;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[((outPtr)>>2)]=0;
  return outPtr - startPtr;
}

// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF32(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i);
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) ++i; // possibly a lead surrogate, so skip over the tail surrogate.
    len += 4;
  }

  return len;
}

// Allocate heap space for a JS string, and write it there.
// It is the responsibility of the caller to free() that memory.
function allocateUTF8(str) {
  var size = lengthBytesUTF8(str) + 1;
  var ret = _malloc(size);
  if (ret) stringToUTF8Array(str, HEAP8, ret, size);
  return ret;
}

// Allocate stack space for a JS string, and write it there.
function allocateUTF8OnStack(str) {
  var size = lengthBytesUTF8(str) + 1;
  var ret = stackAlloc(size);
  stringToUTF8Array(str, HEAP8, ret, size);
  return ret;
}

// Deprecated: This function should not be called because it is unsafe and does not provide
// a maximum length limit of how many bytes it is allowed to write. Prefer calling the
// function stringToUTF8Array() instead, which takes in a maximum length that can be used
// to be secure from out of bounds writes.
/** @deprecated */
function writeStringToMemory(string, buffer, dontAddNull) {
  warnOnce('writeStringToMemory is deprecated and should not be called! Use stringToUTF8() instead!');

  var /** @type {number} */ lastChar, /** @type {number} */ end;
  if (dontAddNull) {
    // stringToUTF8Array always appends null. If we don't want to do that, remember the
    // character that existed at the location where the null will be placed, and restore
    // that after the write (below).
    end = buffer + lengthBytesUTF8(string);
    lastChar = HEAP8[end];
  }
  stringToUTF8(string, buffer, Infinity);
  if (dontAddNull) HEAP8[end] = lastChar; // Restore the value under the null character.
}

function writeArrayToMemory(array, buffer) {
  assert(array.length >= 0, 'writeArrayToMemory array must have a length (should be an array or typed array)')
  HEAP8.set(array, buffer);
}

function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; ++i) {
    assert(str.charCodeAt(i) === str.charCodeAt(i)&0xff);
    HEAP8[((buffer++)>>0)]=str.charCodeAt(i);
  }
  // Null-terminate the pointer to the HEAP.
  if (!dontAddNull) HEAP8[((buffer)>>0)]=0;
}



// Memory management

var PAGE_SIZE = 16384;
var WASM_PAGE_SIZE = 65536;
var ASMJS_PAGE_SIZE = 16777216;

function alignUp(x, multiple) {
  if (x % multiple > 0) {
    x += multiple - (x % multiple);
  }
  return x;
}

var HEAP,
/** @type {ArrayBuffer} */
  buffer,
/** @type {Int8Array} */
  HEAP8,
/** @type {Uint8Array} */
  HEAPU8,
/** @type {Int16Array} */
  HEAP16,
/** @type {Uint16Array} */
  HEAPU16,
/** @type {Int32Array} */
  HEAP32,
/** @type {Uint32Array} */
  HEAPU32,
/** @type {Float32Array} */
  HEAPF32,
/** @type {Float64Array} */
  HEAPF64;

function updateGlobalBufferAndViews(buf) {
  buffer = buf;
  Module['HEAP8'] = HEAP8 = new Int8Array(buf);
  Module['HEAP16'] = HEAP16 = new Int16Array(buf);
  Module['HEAP32'] = HEAP32 = new Int32Array(buf);
  Module['HEAPU8'] = HEAPU8 = new Uint8Array(buf);
  Module['HEAPU16'] = HEAPU16 = new Uint16Array(buf);
  Module['HEAPU32'] = HEAPU32 = new Uint32Array(buf);
  Module['HEAPF32'] = HEAPF32 = new Float32Array(buf);
  Module['HEAPF64'] = HEAPF64 = new Float64Array(buf);
}

var STATIC_BASE = 1024,
    STACK_BASE = 5274464,
    STACKTOP = STACK_BASE,
    STACK_MAX = 31584,
    DYNAMIC_BASE = 5274464,
    DYNAMICTOP_PTR = 31424;

assert(STACK_BASE % 16 === 0, 'stack must start aligned');
assert(DYNAMIC_BASE % 16 === 0, 'heap must start aligned');



var TOTAL_STACK = 5242880;
if (Module['TOTAL_STACK']) assert(TOTAL_STACK === Module['TOTAL_STACK'], 'the stack size can no longer be determined at runtime')

var INITIAL_TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;if (!Object.getOwnPropertyDescriptor(Module, 'TOTAL_MEMORY')) Object.defineProperty(Module, 'TOTAL_MEMORY', { configurable: true, get: function() { abort('Module.TOTAL_MEMORY has been replaced with plain INITIAL_TOTAL_MEMORY') } });

assert(INITIAL_TOTAL_MEMORY >= TOTAL_STACK, 'TOTAL_MEMORY should be larger than TOTAL_STACK, was ' + INITIAL_TOTAL_MEMORY + '! (TOTAL_STACK=' + TOTAL_STACK + ')');

// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && Int32Array.prototype.subarray !== undefined && Int32Array.prototype.set !== undefined,
       'JS engine does not provide full typed array support');






// In standalone mode, the wasm creates the memory, and the user can't provide it.
// In non-standalone/normal mode, we create the memory here.

// Create the main memory. (Note: this isn't used in STANDALONE_WASM mode since the wasm
// memory is created in the wasm, not in JS.)

  if (Module['wasmMemory']) {
    wasmMemory = Module['wasmMemory'];
  } else
  {
    wasmMemory = new WebAssembly.Memory({
      'initial': INITIAL_TOTAL_MEMORY / WASM_PAGE_SIZE
      ,
      'maximum': INITIAL_TOTAL_MEMORY / WASM_PAGE_SIZE
    });
  }


if (wasmMemory) {
  buffer = wasmMemory.buffer;
}

// If the user provides an incorrect length, just use that length instead rather than providing the user to
// specifically provide the memory length with Module['TOTAL_MEMORY'].
INITIAL_TOTAL_MEMORY = buffer.byteLength;
assert(INITIAL_TOTAL_MEMORY % WASM_PAGE_SIZE === 0);
updateGlobalBufferAndViews(buffer);

HEAP32[DYNAMICTOP_PTR>>2] = DYNAMIC_BASE;




// Initializes the stack cookie. Called at the startup of main and at the startup of each thread in pthreads mode.
function writeStackCookie() {
  assert((STACK_MAX & 3) == 0);
  // The stack grows downwards
  HEAPU32[(STACK_MAX >> 2)+1] = 0x2135467;
  HEAPU32[(STACK_MAX >> 2)+2] = 0x89BACDFE;
  // Also test the global address 0 for integrity.
  // We don't do this with ASan because ASan does its own checks for this.
  HEAP32[0] = 0x63736d65; /* 'emsc' */
}

function checkStackCookie() {
  var cookie1 = HEAPU32[(STACK_MAX >> 2)+1];
  var cookie2 = HEAPU32[(STACK_MAX >> 2)+2];
  if (cookie1 != 0x2135467 || cookie2 != 0x89BACDFE) {
    abort('Stack overflow! Stack cookie has been overwritten, expected hex dwords 0x89BACDFE and 0x2135467, but received 0x' + cookie2.toString(16) + ' ' + cookie1.toString(16));
  }
  // Also test the global address 0 for integrity.
  // We don't do this with ASan because ASan does its own checks for this.
  if (HEAP32[0] !== 0x63736d65 /* 'emsc' */) abort('Runtime error: The application has corrupted its heap memory area (address zero)!');
}

function abortStackOverflow(allocSize) {
  abort('Stack overflow! Attempted to allocate ' + allocSize + ' bytes on the stack, but stack has only ' + (STACK_MAX - stackSave() + allocSize) + ' bytes available!');
}




// Endianness check (note: assumes compiler arch was little-endian)
(function() {
  var h16 = new Int16Array(1);
  var h8 = new Int8Array(h16.buffer);
  h16[0] = 0x6373;
  if (h8[0] !== 0x73 || h8[1] !== 0x63) throw 'Runtime error: expected the system to be little-endian!';
})();

function abortFnPtrError(ptr, sig) {
	abort("Invalid function pointer " + ptr + " called with signature '" + sig + "'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this). Build with ASSERTIONS=2 for more info.");
}



function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Module['dynCall_v'](func);
      } else {
        Module['dynCall_vi'](func, callback.arg);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the main() is called

var runtimeInitialized = false;
var runtimeExited = false;


function preRun() {

  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }

  callRuntimeCallbacks(__ATPRERUN__);
}

function initRuntime() {
  checkStackCookie();
  assert(!runtimeInitialized);
  runtimeInitialized = true;
  
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  checkStackCookie();
  
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  checkStackCookie();
  runtimeExited = true;
}

function postRun() {
  checkStackCookie();

  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }

  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}

function addOnExit(cb) {
}

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}

function unSign(value, bits, ignore) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}


// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/imul

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/fround

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/clz32

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/trunc

assert(Math.imul, 'This browser does not support Math.imul(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
assert(Math.fround, 'This browser does not support Math.fround(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
assert(Math.clz32, 'This browser does not support Math.clz32(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');
assert(Math.trunc, 'This browser does not support Math.trunc(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill');

var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_round = Math.round;
var Math_min = Math.min;
var Math_max = Math.max;
var Math_clz32 = Math.clz32;
var Math_trunc = Math.trunc;



// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// Module.preRun (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
var runDependencyTracking = {};

function getUniqueRunDependency(id) {
  var orig = id;
  while (1) {
    if (!runDependencyTracking[id]) return id;
    id = orig + Math.random();
  }
  return id;
}

function addRunDependency(id) {
  runDependencies++;

  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }

  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval !== 'undefined') {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(function() {
        if (ABORT) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
          return;
        }
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            err('still waiting on run dependencies:');
          }
          err('dependency: ' + dep);
        }
        if (shown) {
          err('(end of list)');
        }
      }, 10000);
    }
  } else {
    err('warning: run dependency added without ID');
  }
}

function removeRunDependency(id) {
  runDependencies--;

  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }

  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    err('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data


function abort(what) {
  if (Module['onAbort']) {
    Module['onAbort'](what);
  }

  what += '';
  out(what);
  err(what);

  ABORT = true;
  EXITSTATUS = 1;

  var output = 'abort(' + what + ') at ' + stackTrace();
  what = output;

  // Throw a wasm runtime error, because a JS error might be seen as a foreign
  // exception, which means we'd run destructors on it. We need the error to
  // simply make the program stop.
  throw new WebAssembly.RuntimeError(what);
}


var memoryInitializer = null;



// show errors on likely calls to FS when it was not included
var FS = {
  error: function() {
    abort('Filesystem support (FS) was not included. The problem is that you are using files from JS, but files were not used from C/C++, so filesystem support was not auto-included. You can force-include filesystem support with  -s FORCE_FILESYSTEM=1');
  },
  init: function() { FS.error() },
  createDataFile: function() { FS.error() },
  createPreloadedFile: function() { FS.error() },
  createLazyFile: function() { FS.error() },
  open: function() { FS.error() },
  mkdev: function() { FS.error() },
  registerDevice: function() { FS.error() },
  analyzePath: function() { FS.error() },
  loadFilesFromDB: function() { FS.error() },

  ErrnoError: function ErrnoError() { FS.error() },
};
Module['FS_createDataFile'] = FS.createDataFile;
Module['FS_createPreloadedFile'] = FS.createPreloadedFile;



// Copyright 2017 The Emscripten Authors.  All rights reserved.
// Emscripten is available under two separate licenses, the MIT license and the
// University of Illinois/NCSA Open Source License.  Both these licenses can be
// found in the LICENSE file.

// Prefix of data URIs emitted by SINGLE_FILE and related options.
var dataURIPrefix = 'data:application/octet-stream;base64,';

// Indicates whether filename is a base64 data URI.
function isDataURI(filename) {
  return String.prototype.startsWith ?
      filename.startsWith(dataURIPrefix) :
      filename.indexOf(dataURIPrefix) === 0;
}




var wasmBinaryFile = 'data:application/octet-stream;base64,AGFzbQEAAAABiQMnYAR/f39/AGABfwF/YAN/f38AYAN/f38Bf2AFf39/f38AYAZ/f39/f38AYAJ/fwF/YAF/AGACf38AYAh/f39/f39/fwBgAAF/YAd/f39/f39/AX9gAXwBfGAAAGAHf39/f39/fwBgCX9/f39/f39/fwBgBH9/f38Bf2AFf39/f38Bf2AGf39/f39/AX9gCH9/f39/f39/AX9gC39/f39/f39/f39/AGANf39/f39/f39/f39/fwBgDn9/f39/f39/f39/f39/AGAXf39/f39/f39/f39/f39/f39/f39/f38AYAx/f39/f319f39/f38AYAR/f31/AGAJf39/f39/f39/AX9gC39/f39/f39/f39/AX9gE39/f39/f39/f39/f39/f39/f38Bf2ALf39/f39/f399f38Bf2AJf39/f39/f31/AX9gB39/f39/f30Bf2AJf39/f39/fX9/AX9gAnx/AX9gBH9/f38BfWAFf39/f38BfWACfH8BfGACfHwBfGADfHx/AXwCdwUDZW52FmVtc2NyaXB0ZW5fcmVzaXplX2hlYXAAAQNlbnYVZW1zY3JpcHRlbl9tZW1jcHlfYmlnAAMDZW52F19faGFuZGxlX3N0YWNrX292ZXJmbG93AA0DZW52Bm1lbW9yeQIBgAKAAgNlbnYFdGFibGUBcAABA4gBhgEKDQoBAwMBBwMCBAYABwACBQAHBAAJAgEAAAAEABAQAwIGBgAGAwYGCAgABAACAgICBQQBBAgCAgQCBAsFAQETAwEYAAEDCQ4PHCQMJQwRISYMACIFIyAfGREBAQ8WFx0bAB4AFAIFAA4LBAUFCAkBAwMLAgkVAAYTAwMaEhIDBwgHCgEHAQYVA38BQcD1wQILfwBBwPUBC38BQQALB+kBDhFfX3dhc21fY2FsbF9jdG9ycwAEE29wdXNfZGVjb2Rlcl9jcmVhdGUAfRFvcHVzX2RlY29kZV9mbG9hdACAARBvcHVzX2RlY29kZXJfY3RsAIEBFG9wdXNfZGVjb2Rlcl9kZXN0cm95AIIBCHNldFRocmV3AIMBBm1hbGxvYwAJBGZyZWUACgpfX2RhdGFfZW5kAwERX19zZXRfc3RhY2tfbGltaXQAhAEJc3RhY2tTYXZlAIUBCnN0YWNrQWxsb2MAhgEMc3RhY2tSZXN0b3JlAIcBEF9fZ3Jvd1dhc21NZW1vcnkAiAEK9dIFhgEGAEHA9QELAgALBgBBxPEBC1ABAn8CQBADIgEoAgAiAiAAQQNqQXxxaiIAQX9KDQAQBUEwNgIAQX8PCwJAIAA/AEEQdE0NACAAEAANABAFQTA2AgBBfw8LIAEgADYCACACC/MCAgN/AX4CQCACRQ0AIAIgAGoiA0F/aiABOgAAIAAgAToAACACQQNJDQAgA0F+aiABOgAAIAAgAToAASADQX1qIAE6AAAgACABOgACIAJBB0kNACADQXxqIAE6AAAgACABOgADIAJBCUkNACAAQQAgAGtBA3EiBGoiAyABQf8BcUGBgoQIbCIBNgIAIAMgAiAEa0F8cSIEaiICQXxqIAE2AgAgBEEJSQ0AIAMgATYCCCADIAE2AgQgAkF4aiABNgIAIAJBdGogATYCACAEQRlJDQAgAyABNgIYIAMgATYCFCADIAE2AhAgAyABNgIMIAJBcGogATYCACACQWxqIAE2AgAgAkFoaiABNgIAIAJBZGogATYCACAEIANBBHFBGHIiBWsiAkEgSQ0AIAGtIgZCIIYgBoQhBiADIAVqIQEDQCABIAY3AxggASAGNwMQIAEgBjcDCCABIAY3AwAgAUEgaiEBIAJBYGoiAkEfSw0ACwsgAAuTBAEDfwJAIAJBgMAASQ0AIAAgASACEAEaIAAPCyAAIAJqIQMCQAJAIAEgAHNBA3ENAAJAAkAgAkEBTg0AIAAhAgwBCwJAIABBA3ENACAAIQIMAQsgACECA0AgAiABLQAAOgAAIAFBAWohASACQQFqIgIgA08NASACQQNxDQALCwJAIANBfHEiBEHAAEkNACACIARBQGoiBUsNAANAIAIgASgCADYCACACIAEoAgQ2AgQgAiABKAIINgIIIAIgASgCDDYCDCACIAEoAhA2AhAgAiABKAIUNgIUIAIgASgCGDYCGCACIAEoAhw2AhwgAiABKAIgNgIgIAIgASgCJDYCJCACIAEoAig2AiggAiABKAIsNgIsIAIgASgCMDYCMCACIAEoAjQ2AjQgAiABKAI4NgI4IAIgASgCPDYCPCABQcAAaiEBIAJBwABqIgIgBU0NAAsLIAIgBE8NAQNAIAIgASgCADYCACABQQRqIQEgAkEEaiICIARJDQAMAgALAAsCQCADQQRPDQAgACECDAELAkAgA0F8aiIEIABPDQAgACECDAELIAAhAgNAIAIgAS0AADoAACACIAEtAAE6AAEgAiABLQACOgACIAIgAS0AAzoAAyABQQRqIQEgAkEEaiICIARNDQALCwJAIAIgA08NAANAIAIgAS0AADoAACABQQFqIQEgAkEBaiICIANHDQALCyAAC44xAQ1/AkAjAEEQayIBIgwjAkkEQBACCyAMJAALAkACQAJAAkACQAJAAkACQAJAAkACQAJAIABB9AFLDQACQEEAKALI8QEiAkEQIABBC2pBeHEgAEELSRsiA0EDdiIEdiIAQQNxRQ0AIABBf3NBAXEgBGoiA0EDdCIFQfjxAWooAgAiBEEIaiEAAkACQCAEKAIIIgYgBUHw8QFqIgVHDQBBACACQX4gA3dxNgLI8QEMAQtBACgC2PEBIAZLGiAGIAU2AgwgBSAGNgIICyAEIANBA3QiBkEDcjYCBCAEIAZqIgQgBCgCBEEBcjYCBAwMCyADQQAoAtDxASIHTQ0BAkAgAEUNAAJAAkAgACAEdEECIAR0IgBBACAAa3JxIgBBACAAa3FBf2oiACAAQQx2QRBxIgB2IgRBBXZBCHEiBiAAciAEIAZ2IgBBAnZBBHEiBHIgACAEdiIAQQF2QQJxIgRyIAAgBHYiAEEBdkEBcSIEciAAIAR2aiIGQQN0IgVB+PEBaigCACIEKAIIIgAgBUHw8QFqIgVHDQBBACACQX4gBndxIgI2AsjxAQwBC0EAKALY8QEgAEsaIAAgBTYCDCAFIAA2AggLIARBCGohACAEIANBA3I2AgQgBCADaiIFIAZBA3QiCCADayIGQQFyNgIEIAQgCGogBjYCAAJAIAdFDQAgB0EDdiIIQQN0QfDxAWohA0EAKALc8QEhBAJAAkAgAkEBIAh0IghxDQBBACACIAhyNgLI8QEgAyEIDAELIAMoAgghCAsgAyAENgIIIAggBDYCDCAEIAM2AgwgBCAINgIIC0EAIAU2AtzxAUEAIAY2AtDxAQwMC0EAKALM8QEiCUUNASAJQQAgCWtxQX9qIgAgAEEMdkEQcSIAdiIEQQV2QQhxIgYgAHIgBCAGdiIAQQJ2QQRxIgRyIAAgBHYiAEEBdkECcSIEciAAIAR2IgBBAXZBAXEiBHIgACAEdmpBAnRB+PMBaigCACIFKAIEQXhxIANrIQQgBSEGAkADQAJAIAYoAhAiAA0AIAZBFGooAgAiAEUNAgsgACgCBEF4cSADayIGIAQgBiAESSIGGyEEIAAgBSAGGyEFIAAhBgwAAAsACyAFKAIYIQoCQCAFKAIMIgggBUYNAAJAQQAoAtjxASAFKAIIIgBLDQAgACgCDCAFRxoLIAAgCDYCDCAIIAA2AggMCwsCQCAFQRRqIgYoAgAiAA0AIAUoAhAiAEUNAyAFQRBqIQYLA0AgBiELIAAiCEEUaiIGKAIAIgANACAIQRBqIQYgCCgCECIADQALIAtBADYCAAwKC0F/IQMgAEG/f0sNACAAQQtqIgBBeHEhA0EAKALM8QEiB0UNAEEAIQsCQCAAQQh2IgBFDQBBHyELIANB////B0sNACAAIABBgP4/akEQdkEIcSIEdCIAIABBgOAfakEQdkEEcSIAdCIGIAZBgIAPakEQdkECcSIGdEEPdiAAIARyIAZyayIAQQF0IAMgAEEVanZBAXFyQRxqIQsLQQAgA2shBgJAAkACQAJAIAtBAnRB+PMBaigCACIEDQBBACEAQQAhCAwBCyADQQBBGSALQQF2ayALQR9GG3QhBUEAIQBBACEIA0ACQCAEKAIEQXhxIANrIgIgBk8NACACIQYgBCEIIAINAEEAIQYgBCEIIAQhAAwDCyAAIARBFGooAgAiAiACIAQgBUEddkEEcWpBEGooAgAiBEYbIAAgAhshACAFIARBAEd0IQUgBA0ACwsCQCAAIAhyDQBBAiALdCIAQQAgAGtyIAdxIgBFDQMgAEEAIABrcUF/aiIAIABBDHZBEHEiAHYiBEEFdkEIcSIFIAByIAQgBXYiAEECdkEEcSIEciAAIAR2IgBBAXZBAnEiBHIgACAEdiIAQQF2QQFxIgRyIAAgBHZqQQJ0QfjzAWooAgAhAAsgAEUNAQsDQCAAKAIEQXhxIANrIgIgBkkhBQJAIAAoAhAiBA0AIABBFGooAgAhBAsgAiAGIAUbIQYgACAIIAUbIQggBCEAIAQNAAsLIAhFDQAgBkEAKALQ8QEgA2tPDQAgCCgCGCELAkAgCCgCDCIFIAhGDQACQEEAKALY8QEgCCgCCCIASw0AIAAoAgwgCEcaCyAAIAU2AgwgBSAANgIIDAkLAkAgCEEUaiIEKAIAIgANACAIKAIQIgBFDQMgCEEQaiEECwNAIAQhAiAAIgVBFGoiBCgCACIADQAgBUEQaiEEIAUoAhAiAA0ACyACQQA2AgAMCAsCQEEAKALQ8QEiACADSQ0AQQAoAtzxASEEAkACQCAAIANrIgZBEEkNAEEAIAY2AtDxAUEAIAQgA2oiBTYC3PEBIAUgBkEBcjYCBCAEIABqIAY2AgAgBCADQQNyNgIEDAELQQBBADYC3PEBQQBBADYC0PEBIAQgAEEDcjYCBCAEIABqIgAgACgCBEEBcjYCBAsgBEEIaiEADAoLAkBBACgC1PEBIgUgA00NAEEAIAUgA2siBDYC1PEBQQBBACgC4PEBIgAgA2oiBjYC4PEBIAYgBEEBcjYCBCAAIANBA3I2AgQgAEEIaiEADAoLAkACQEEAKAKg9QFFDQBBACgCqPUBIQQMAQtBAEJ/NwKs9QFBAEKAoICAgIAENwKk9QFBACABQQxqQXBxQdiq1aoFczYCoPUBQQBBADYCtPUBQQBBADYChPUBQYAgIQQLQQAhACAEIANBL2oiB2oiAkEAIARrIgtxIgggA00NCUEAIQACQEEAKAKA9QEiBEUNAEEAKAL49AEiBiAIaiIJIAZNDQogCSAESw0KC0EALQCE9QFBBHENBAJAAkACQEEAKALg8QEiBEUNAEGI9QEhAANAAkAgACgCACIGIARLDQAgBiAAKAIEaiAESw0DCyAAKAIIIgANAAsLQQAQBiIFQX9GDQUgCCECAkBBACgCpPUBIgBBf2oiBCAFcUUNACAIIAVrIAQgBWpBACAAa3FqIQILIAIgA00NBSACQf7///8HSw0FAkBBACgCgPUBIgBFDQBBACgC+PQBIgQgAmoiBiAETQ0GIAYgAEsNBgsgAhAGIgAgBUcNAQwHCyACIAVrIAtxIgJB/v///wdLDQQgAhAGIgUgACgCACAAKAIEakYNAyAFIQALIAAhBQJAIANBMGogAk0NACACQf7///8HSw0AIAVBf0YNACAHIAJrQQAoAqj1ASIAakEAIABrcSIAQf7///8HSw0GAkAgABAGQX9GDQAgACACaiECDAcLQQAgAmsQBhoMBAsgBUF/Rw0FDAMLQQAhCAwHC0EAIQUMBQsgBUF/Rw0CC0EAQQAoAoT1AUEEcjYChPUBCyAIQf7///8HSw0BIAgQBiIFQQAQBiIATw0BIAVBf0YNASAAQX9GDQEgACAFayICIANBKGpNDQELQQBBACgC+PQBIAJqIgA2Avj0AQJAIABBACgC/PQBTQ0AQQAgADYC/PQBCwJAAkACQAJAQQAoAuDxASIERQ0AQYj1ASEAA0AgBSAAKAIAIgYgACgCBCIIakYNAiAAKAIIIgANAAwDAAsACwJAAkBBACgC2PEBIgBFDQAgBSAATw0BC0EAIAU2AtjxAQtBACEAQQAgAjYCjPUBQQAgBTYCiPUBQQBBfzYC6PEBQQBBACgCoPUBNgLs8QFBAEEANgKU9QEDQCAAQQN0IgRB+PEBaiAEQfDxAWoiBjYCACAEQfzxAWogBjYCACAAQQFqIgBBIEcNAAtBACACQVhqIgBBeCAFa0EHcUEAIAVBCGpBB3EbIgRrIgY2AtTxAUEAIAUgBGoiBDYC4PEBIAQgBkEBcjYCBCAFIABqQSg2AgRBAEEAKAKw9QE2AuTxAQwCCyAALQAMQQhxDQAgBSAETQ0AIAYgBEsNACAAIAggAmo2AgRBACAEQXggBGtBB3FBACAEQQhqQQdxGyIAaiIGNgLg8QFBAEEAKALU8QEgAmoiBSAAayIANgLU8QEgBiAAQQFyNgIEIAQgBWpBKDYCBEEAQQAoArD1ATYC5PEBDAELAkAgBUEAKALY8QEiCE8NAEEAIAU2AtjxASAFIQgLIAUgAmohBkGI9QEhAAJAAkACQAJAAkACQAJAA0AgACgCACAGRg0BIAAoAggiAA0ADAIACwALIAAtAAxBCHFFDQELQYj1ASEAA0ACQCAAKAIAIgYgBEsNACAGIAAoAgRqIgYgBEsNAwsgACgCCCEADAAACwALIAAgBTYCACAAIAAoAgQgAmo2AgQgBUF4IAVrQQdxQQAgBUEIakEHcRtqIgsgA0EDcjYCBCAGQXggBmtBB3FBACAGQQhqQQdxG2oiBSALayADayEAIAsgA2ohBgJAIAQgBUcNAEEAIAY2AuDxAUEAQQAoAtTxASAAaiIANgLU8QEgBiAAQQFyNgIEDAMLAkBBACgC3PEBIAVHDQBBACAGNgLc8QFBAEEAKALQ8QEgAGoiADYC0PEBIAYgAEEBcjYCBCAGIABqIAA2AgAMAwsCQCAFKAIEIgRBA3FBAUcNACAEQXhxIQcCQAJAIARB/wFLDQAgBSgCDCEDAkAgBSgCCCICIARBA3YiCUEDdEHw8QFqIgRGDQAgCCACSxoLAkAgAyACRw0AQQBBACgCyPEBQX4gCXdxNgLI8QEMAgsCQCADIARGDQAgCCADSxoLIAIgAzYCDCADIAI2AggMAQsgBSgCGCEJAkACQCAFKAIMIgIgBUYNAAJAIAggBSgCCCIESw0AIAQoAgwgBUcaCyAEIAI2AgwgAiAENgIIDAELAkAgBUEUaiIEKAIAIgMNACAFQRBqIgQoAgAiAw0AQQAhAgwBCwNAIAQhCCADIgJBFGoiBCgCACIDDQAgAkEQaiEEIAIoAhAiAw0ACyAIQQA2AgALIAlFDQACQAJAIAUoAhwiA0ECdEH48wFqIgQoAgAgBUcNACAEIAI2AgAgAg0BQQBBACgCzPEBQX4gA3dxNgLM8QEMAgsgCUEQQRQgCSgCECAFRhtqIAI2AgAgAkUNAQsgAiAJNgIYAkAgBSgCECIERQ0AIAIgBDYCECAEIAI2AhgLIAUoAhQiBEUNACACQRRqIAQ2AgAgBCACNgIYCyAHIABqIQAgBSAHaiEFCyAFIAUoAgRBfnE2AgQgBiAAQQFyNgIEIAYgAGogADYCAAJAIABB/wFLDQAgAEEDdiIEQQN0QfDxAWohAAJAAkBBACgCyPEBIgNBASAEdCIEcQ0AQQAgAyAEcjYCyPEBIAAhBAwBCyAAKAIIIQQLIAAgBjYCCCAEIAY2AgwgBiAANgIMIAYgBDYCCAwDC0EAIQQCQCAAQQh2IgNFDQBBHyEEIABB////B0sNACADIANBgP4/akEQdkEIcSIEdCIDIANBgOAfakEQdkEEcSIDdCIFIAVBgIAPakEQdkECcSIFdEEPdiADIARyIAVyayIEQQF0IAAgBEEVanZBAXFyQRxqIQQLIAYgBDYCHCAGQgA3AhAgBEECdEH48wFqIQMCQAJAQQAoAszxASIFQQEgBHQiCHENAEEAIAUgCHI2AszxASADIAY2AgAgBiADNgIYDAELIABBAEEZIARBAXZrIARBH0YbdCEEIAMoAgAhBQNAIAUiAygCBEF4cSAARg0DIARBHXYhBSAEQQF0IQQgAyAFQQRxakEQaiIIKAIAIgUNAAsgCCAGNgIAIAYgAzYCGAsgBiAGNgIMIAYgBjYCCAwCC0EAIAJBWGoiAEF4IAVrQQdxQQAgBUEIakEHcRsiCGsiCzYC1PEBQQAgBSAIaiIINgLg8QEgCCALQQFyNgIEIAUgAGpBKDYCBEEAQQAoArD1ATYC5PEBIAQgBkEnIAZrQQdxQQAgBkFZakEHcRtqQVFqIgAgACAEQRBqSRsiCEEbNgIEIAhBEGpBACkCkPUBNwIAIAhBACkCiPUBNwIIQQAgCEEIajYCkPUBQQAgAjYCjPUBQQAgBTYCiPUBQQBBADYClPUBIAhBGGohAANAIABBBzYCBCAAQQhqIQUgAEEEaiEAIAYgBUsNAAsgCCAERg0DIAggCCgCBEF+cTYCBCAEIAggBGsiAkEBcjYCBCAIIAI2AgACQCACQf8BSw0AIAJBA3YiBkEDdEHw8QFqIQACQAJAQQAoAsjxASIFQQEgBnQiBnENAEEAIAUgBnI2AsjxASAAIQYMAQsgACgCCCEGCyAAIAQ2AgggBiAENgIMIAQgADYCDCAEIAY2AggMBAtBACEAAkAgAkEIdiIGRQ0AQR8hACACQf///wdLDQAgBiAGQYD+P2pBEHZBCHEiAHQiBiAGQYDgH2pBEHZBBHEiBnQiBSAFQYCAD2pBEHZBAnEiBXRBD3YgBiAAciAFcmsiAEEBdCACIABBFWp2QQFxckEcaiEACyAEQgA3AhAgBEEcaiAANgIAIABBAnRB+PMBaiEGAkACQEEAKALM8QEiBUEBIAB0IghxDQBBACAFIAhyNgLM8QEgBiAENgIAIARBGGogBjYCAAwBCyACQQBBGSAAQQF2ayAAQR9GG3QhACAGKAIAIQUDQCAFIgYoAgRBeHEgAkYNBCAAQR12IQUgAEEBdCEAIAYgBUEEcWpBEGoiCCgCACIFDQALIAggBDYCACAEQRhqIAY2AgALIAQgBDYCDCAEIAQ2AggMAwsgAygCCCIAIAY2AgwgAyAGNgIIIAZBADYCGCAGIAM2AgwgBiAANgIICyALQQhqIQAMBQsgBigCCCIAIAQ2AgwgBiAENgIIIARBGGpBADYCACAEIAY2AgwgBCAANgIIC0EAKALU8QEiACADTQ0AQQAgACADayIENgLU8QFBAEEAKALg8QEiACADaiIGNgLg8QEgBiAEQQFyNgIEIAAgA0EDcjYCBCAAQQhqIQAMAwsQBUEwNgIAQQAhAAwCCwJAIAtFDQACQAJAIAggCCgCHCIEQQJ0QfjzAWoiACgCAEcNACAAIAU2AgAgBQ0BQQAgB0F+IAR3cSIHNgLM8QEMAgsgC0EQQRQgCygCECAIRhtqIAU2AgAgBUUNAQsgBSALNgIYAkAgCCgCECIARQ0AIAUgADYCECAAIAU2AhgLIAhBFGooAgAiAEUNACAFQRRqIAA2AgAgACAFNgIYCwJAAkAgBkEPSw0AIAggBiADaiIAQQNyNgIEIAggAGoiACAAKAIEQQFyNgIEDAELIAggA0EDcjYCBCAIIANqIgUgBkEBcjYCBCAFIAZqIAY2AgACQCAGQf8BSw0AIAZBA3YiBEEDdEHw8QFqIQACQAJAQQAoAsjxASIGQQEgBHQiBHENAEEAIAYgBHI2AsjxASAAIQQMAQsgACgCCCEECyAAIAU2AgggBCAFNgIMIAUgADYCDCAFIAQ2AggMAQsCQAJAIAZBCHYiBA0AQQAhAAwBC0EfIQAgBkH///8HSw0AIAQgBEGA/j9qQRB2QQhxIgB0IgQgBEGA4B9qQRB2QQRxIgR0IgMgA0GAgA9qQRB2QQJxIgN0QQ92IAQgAHIgA3JrIgBBAXQgBiAAQRVqdkEBcXJBHGohAAsgBSAANgIcIAVCADcCECAAQQJ0QfjzAWohBAJAAkACQCAHQQEgAHQiA3ENAEEAIAcgA3I2AszxASAEIAU2AgAgBSAENgIYDAELIAZBAEEZIABBAXZrIABBH0YbdCEAIAQoAgAhAwNAIAMiBCgCBEF4cSAGRg0CIABBHXYhAyAAQQF0IQAgBCADQQRxakEQaiICKAIAIgMNAAsgAiAFNgIAIAUgBDYCGAsgBSAFNgIMIAUgBTYCCAwBCyAEKAIIIgAgBTYCDCAEIAU2AgggBUEANgIYIAUgBDYCDCAFIAA2AggLIAhBCGohAAwBCwJAIApFDQACQAJAIAUgBSgCHCIGQQJ0QfjzAWoiACgCAEcNACAAIAg2AgAgCA0BQQAgCUF+IAZ3cTYCzPEBDAILIApBEEEUIAooAhAgBUYbaiAINgIAIAhFDQELIAggCjYCGAJAIAUoAhAiAEUNACAIIAA2AhAgACAINgIYCyAFQRRqKAIAIgBFDQAgCEEUaiAANgIAIAAgCDYCGAsCQAJAIARBD0sNACAFIAQgA2oiAEEDcjYCBCAFIABqIgAgACgCBEEBcjYCBAwBCyAFIANBA3I2AgQgBSADaiIGIARBAXI2AgQgBiAEaiAENgIAAkAgB0UNACAHQQN2IghBA3RB8PEBaiEDQQAoAtzxASEAAkACQEEBIAh0IgggAnENAEEAIAggAnI2AsjxASADIQgMAQsgAygCCCEICyADIAA2AgggCCAANgIMIAAgAzYCDCAAIAg2AggLQQAgBjYC3PEBQQAgBDYC0PEBCyAFQQhqIQALAkAgAUEQaiINIwJJBEAQAgsgDSQACyAAC5UOAQd/AkAgAEUNACAAQXhqIgEgAEF8aigCACICQXhxIgBqIQMCQCACQQFxDQAgAkEDcUUNASABIAEoAgAiAmsiAUEAKALY8QEiBEkNASACIABqIQACQEEAKALc8QEgAUYNAAJAIAJB/wFLDQAgASgCDCEFAkAgASgCCCIGIAJBA3YiB0EDdEHw8QFqIgJGDQAgBCAGSxoLAkAgBSAGRw0AQQBBACgCyPEBQX4gB3dxNgLI8QEMAwsCQCAFIAJGDQAgBCAFSxoLIAYgBTYCDCAFIAY2AggMAgsgASgCGCEHAkACQCABKAIMIgUgAUYNAAJAIAQgASgCCCICSw0AIAIoAgwgAUcaCyACIAU2AgwgBSACNgIIDAELAkAgAUEUaiICKAIAIgQNACABQRBqIgIoAgAiBA0AQQAhBQwBCwNAIAIhBiAEIgVBFGoiAigCACIEDQAgBUEQaiECIAUoAhAiBA0ACyAGQQA2AgALIAdFDQECQAJAIAEoAhwiBEECdEH48wFqIgIoAgAgAUcNACACIAU2AgAgBQ0BQQBBACgCzPEBQX4gBHdxNgLM8QEMAwsgB0EQQRQgBygCECABRhtqIAU2AgAgBUUNAgsgBSAHNgIYAkAgASgCECICRQ0AIAUgAjYCECACIAU2AhgLIAEoAhQiAkUNASAFQRRqIAI2AgAgAiAFNgIYDAELIAMoAgQiAkEDcUEDRw0AQQAgADYC0PEBIAMgAkF+cTYCBCABIABBAXI2AgQgASAAaiAANgIADwsgAyABTQ0AIAMoAgQiAkEBcUUNAAJAAkAgAkECcQ0AAkBBACgC4PEBIANHDQBBACABNgLg8QFBAEEAKALU8QEgAGoiADYC1PEBIAEgAEEBcjYCBCABQQAoAtzxAUcNA0EAQQA2AtDxAUEAQQA2AtzxAQ8LAkBBACgC3PEBIANHDQBBACABNgLc8QFBAEEAKALQ8QEgAGoiADYC0PEBIAEgAEEBcjYCBCABIABqIAA2AgAPCyACQXhxIABqIQACQAJAIAJB/wFLDQAgAygCDCEEAkAgAygCCCIFIAJBA3YiA0EDdEHw8QFqIgJGDQBBACgC2PEBIAVLGgsCQCAEIAVHDQBBAEEAKALI8QFBfiADd3E2AsjxAQwCCwJAIAQgAkYNAEEAKALY8QEgBEsaCyAFIAQ2AgwgBCAFNgIIDAELIAMoAhghBwJAAkAgAygCDCIFIANGDQACQEEAKALY8QEgAygCCCICSw0AIAIoAgwgA0caCyACIAU2AgwgBSACNgIIDAELAkAgA0EUaiICKAIAIgQNACADQRBqIgIoAgAiBA0AQQAhBQwBCwNAIAIhBiAEIgVBFGoiAigCACIEDQAgBUEQaiECIAUoAhAiBA0ACyAGQQA2AgALIAdFDQACQAJAIAMoAhwiBEECdEH48wFqIgIoAgAgA0cNACACIAU2AgAgBQ0BQQBBACgCzPEBQX4gBHdxNgLM8QEMAgsgB0EQQRQgBygCECADRhtqIAU2AgAgBUUNAQsgBSAHNgIYAkAgAygCECICRQ0AIAUgAjYCECACIAU2AhgLIAMoAhQiAkUNACAFQRRqIAI2AgAgAiAFNgIYCyABIABBAXI2AgQgASAAaiAANgIAIAFBACgC3PEBRw0BQQAgADYC0PEBDwsgAyACQX5xNgIEIAEgAEEBcjYCBCABIABqIAA2AgALAkAgAEH/AUsNACAAQQN2IgJBA3RB8PEBaiEAAkACQEEAKALI8QEiBEEBIAJ0IgJxDQBBACAEIAJyNgLI8QEgACECDAELIAAoAgghAgsgACABNgIIIAIgATYCDCABIAA2AgwgASACNgIIDwtBACECAkAgAEEIdiIERQ0AQR8hAiAAQf///wdLDQAgBCAEQYD+P2pBEHZBCHEiAnQiBCAEQYDgH2pBEHZBBHEiBHQiBSAFQYCAD2pBEHZBAnEiBXRBD3YgBCACciAFcmsiAkEBdCAAIAJBFWp2QQFxckEcaiECCyABQgA3AhAgAUEcaiACNgIAIAJBAnRB+PMBaiEEAkACQAJAAkBBACgCzPEBIgVBASACdCIDcQ0AQQAgBSADcjYCzPEBIAQgATYCACABQRhqIAQ2AgAMAQsgAEEAQRkgAkEBdmsgAkEfRht0IQIgBCgCACEFA0AgBSIEKAIEQXhxIABGDQIgAkEddiEFIAJBAXQhAiAEIAVBBHFqQRBqIgMoAgAiBQ0ACyADIAE2AgAgAUEYaiAENgIACyABIAE2AgwgASABNgIIDAELIAQoAggiACABNgIMIAQgATYCCCABQRhqQQA2AgAgASAENgIMIAEgADYCCAtBAEEAKALo8QFBf2oiATYC6PEBIAENAEGQ9QEhAQNAIAEoAgAiAEEIaiEBIAANAAtBAEF/NgLo8QELC4cDAQJ/AkAgACABRg0AAkACQCABIAJqIABNDQAgACACaiIDIAFLDQELIAAgASACEAgPCyABIABzQQNxIQQCQAJAAkAgACABTw0AAkAgBEUNACAAIQQMAwsCQCAAQQNxDQAgACEEDAILIAAhBANAIAJFDQQgBCABLQAAOgAAIAFBAWohASACQX9qIQIgBEEBaiIEQQNxRQ0CDAAACwALAkAgBA0AAkAgA0EDcUUNAANAIAJFDQUgACACQX9qIgJqIgQgASACai0AADoAACAEQQNxDQALCyACQQNNDQADQCAAIAJBfGoiAmogASACaigCADYCACACQQNLDQALCyACRQ0CA0AgACACQX9qIgJqIAEgAmotAAA6AAAgAg0ADAMACwALIAJBA00NACACIQMDQCAEIAEoAgA2AgAgAUEEaiEBIARBBGohBCADQXxqIgNBA0sNAAsgAkEDcSECCyACRQ0AA0AgBCABLQAAOgAAIARBAWohBCABQQFqIQEgAkF/aiICDQALCyAAC8gBAQV/IAJBEHUhAyABQX9qIQQCQCABQQJIDQAgAkGAgHxqIQVBACEBA0AgACABQQJ0aiIGIAYoAgAiBkEQdEEQdSIHIAJB//8DcWxBEHUgByADbGogBkEPdUEBakEBdSACbGo2AgAgAiAFbEEPdUEBakEBdSACaiICQRB1IQMgAUEBaiIBIARHDQALCyAAIARBAnRqIgEgASgCACIBQRB0QRB1IgYgAkH//wNxbEEQdSAGIANsaiABQQ91QQFqQQF1IAJsajYCAAuyBAEGfyADIAJrIgVBf2ohBkEAIQcgBEEBSCEIQQAhCQJAAkADQEEAIQNBACECAkAgCA0AA0AgASADQQJ0aigCACIKIApBH3UiCmogCnMiCiACIAogAkoiChshAiADIAkgChshCSADQQFqIgMgBEcNAAsLAkACQCAFQQFHDQAgAkEBdSACQQFxaiEDDAELIAIgBnVBAWpBAXUhAwsCQCADQYCAAkgNACAB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QCAOQRBHDQAgCkEUaigCACIiQRB1IBZsIAlqICJB//8DcSAWbEEQdWogCkEQaigCACIJQRB1IBVsaiAJQf//A3EgFWxBEHVqIApBDGooAgAiCUEQdSAUbGogCUH//wNxIBRsQRB1aiAKQQhqKAIAIglBEHUgE2xqIAlB//8DcSATbEEQdWogCkEEaigCACIJQRB1IBJsaiAJQf//A3EgEmxBEHVqIAooAgAiCkEQdSARbGogCkH//wNxIBFsQRB1aiEJCwJAAkAgCUGAgIBAIAlBgICAQEobIgpB////PyAKQf///z9IG0EEdCIKIAYgIUECdGoiCSgCACIhaiIiQQBIDQBBgICAgHggIiAKICFxQQBIGyEKDAELQf////8HICIgCiAhckF/ShshCgsgCSAKNgIAIAIgAEEBdGoiIUH//wFBgIB+IApBEHUgC2wgCiAQbGogCkH//wNxIAtsQRB1aiIJQQd1QQFqQQF1IAlBgP//e0gbIAlB//7/A0obICEuAQBqIglBgIB+IAlBgIB+ShsiCUH//wEgCUH//wFIGzsBACAHIQkgCCEHIAEhCCAEIQEgAEEBaiIAIANHDQALCyANIAYgA0ECdGoiCikCADcCACANQThqIApBOGopAgA3AgAgDUEwaiAKQTBqKQIANwIAIA1BKGogCkEoaikCADcCACANQSBqIApBIGopAgA3AgAgDUEYaiAKQRhqKQIANwIAIA1BEGogCkEQaikCADcCACANQQhqIApBCGopAgA3AgAgDBoMAQsgAEH0H2pBACAAKAKkEkECdBAHGgsCQCAFQSBqIiUjAkkEQBACCyAlJAALC4ABAQN/IAFBf2ohAwJAIAFBAkgNACACQYCAfGohBEEAIQEDQCAAIAFBAXRqIgUgAiAFLgEAbEEPdkEBakEBdjsBACACIARsQQ91QQFqQQF1IAJqIQIgAUEBaiIBIANHDQALCyAAIANBAXRqIgEgAiABLgEAbEEPdkEBakEBdjsBAAujAgEIfwJAIAQgA04NACAEQQdIIQYgBCEHA0AgAi4BAiAHQQF0IgggAWoiCUF8ai4BAGwgAi4BACAJQX5qIgouAQBsaiACLgEEIAlBemouAQBsaiACLgEGIAlBeGouAQBsaiACLgEIIAlBdmouAQBsaiACLgEKIAlBdGouAQBsaiELQQYhDAJAIAYN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QCAXIAIgAWtBgLEBai0AACIZTg0AQQAhGQwBCyAXIBlrIgggCEEHSkEDdCIVayEXCwJAIBMgGEECdEEPakFwcSIIayIaIhMiKyMCSQRAEAILICskAAsCQCATIAhrIhsiEyIsIwJJBEAQAgsgLCQACwJAIBMgCGsiHCITIi0jAkkEQBACCyAtJAALIA1BA3QhHQJAIBMgCGsiHiIuIwJJBEAQAgsgLiQACwJAIAIgAUwiHw0AIA5BA2ohICAFIA5rQXtqIA1sISEgACgCICIiIAFBAXRqLwEAISMgASEIA0AgI0EQdCEFIBwgCEECdCIkaiAdICIgCEEBaiITQQF0ai4BACIjIAVBEHVrIgVBA2wgDnRBA3RBBHUiJSAdICVKGzYCACAeICRqICEgCEF/cyACamwgBWwgIHRBBnUgHUEAIAUgDnRBAUYbazYCACATIQggEyACRw0ACwsgACgCMCImQX9qISdBASEoA0AgKCAnakEBdSEpQQAhIwJAIB8NACApIBhsISAgACgCICIhIAJBAXRqLwEAISQgACgCNCEiQQAhIyACIQhBACElA0AgJEEQdEEQdSAhIAhBf2oiCEEBdGouAQAiJGsgDWwgIiAIICBqai0AAGwgDnQiBUECdSETAkAgBUEESA0AIB4gCEECdGooAgAgE2oiE0EAIBNBAEobIRMLIAMgCEECdCIFaigCACATaiETAkACQAJAICUNACATIBwgBWooAgBIDQELIBMgBCAFaigCACIFIBMgBUgbIRNBASElDAELQQAhJUEAIB0gEyAdSBshEwsgEyAjaiEjIAggAUoNAAsLICggKUEBaiAjIBdKIggbIiggKUF/aiAnIAgbIidMDQALIAEhIgJAIB8NACAoIBhsISogKEF/aiAYbCEpIAAoAiAiJyABQQF0ai8BACEgIAAoAjQhISABIQggASEiA0AgIEEQdCETICcgCEEBaiIFQQF0ai4BACIgIBNBEHVrIA1sIhMgISAIIClqai0AAGwgDnQhIwJAAkAgKCAmSA0AIAQgCEECdGooAgAhEwwBCyATICEgCCAqamotAABsIA50QQJ1IRMLICNBAnUhJQJAICNBBEgNACAeIAhBAnRqKAIAICVqIiNBACAjQQBKGyElCwJAIBNBAUgNACAeIAhBAnRqKAIAIBNqIhNBACATQQBKGyETCyAa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C20LbQttC20LbQttC5MLkwttCx4LkAwNDJwL8AvwC8ILwgvCC5MLkwvCC5wLSAseCx4LpgpQD64PpQuHDIcMdgvwCx4LMgysDG0LHgs8CvkJ3AptC7wNfQzCCx8MywtIC20LbQttC20LSAtIC0gLSAtIC8EKvhO+E3YL9Q05DfALDQzpClgMWAycCx4L0QnsCcEKSAtMETUQjArBCpwLwgttCx4LpQvLC20LbQttC20LSAumCiQOywucC/AL8As5C/YK8AuQDOcLpQvbDNsMpQvuDK8LaxSWE+wJCg3GDTkNfQwWDDANpQuMClcKfwrpCh4LcQrZEzYUBxJMEZwJUQvnC4cMYQx/CrQKSAseC+kKHguMCjIMSAuTC20LbQttC20LkwuTC5MLkwttC20LkwuTC5MLahCHDKULHwzCC0gLSAttC5wLOQtkC8sLnAvCC30MOQuwDrAOrAwfDKULSAttC0gLnAt2C+kK6QoeC0gLSAtkCg4Prg+HDDIMrAx2C+cLkwuTCw0MHgvpCukK6QrpChQKBQ/wDx0NvA0WDLQKwgt2CzIMDQweCx4LVwpXCh4L9gobFB4TmQwFD3ENYQxRC1UNew2MChQKcQq0Ch4L9grBCg0QzQ7bDFgMbQtIC0gLbQvpCrQK6Qq0CukKHgtIC/YK2RO+E+cL2Q2sDPALDQyACx8MUQu0CrQKtAoeC+kKPArVENUQLAvfCYcMMA0wDQMMAwwwDfALHgtXChQKpgrBCvALZAv2CkgLtAp/ClELHwxODE4MkAxhDPALwguTCx4LFxEqD20LSAseC0gLHgseC0gLSAtICx4LSAttC0gLHgulC2QLZAulC6UL8AsyDJAMTgzwC8ILnAucC5wLbQu0CoUQNRDuDBMNbQuTC0gLpQulCx4L6Qq0Ch4LHgseC+kK8A+uDx8MwgttC20LbQtIC20LbQseCx4LHgvpCkgL3AoHEt8RYQxxDYcMpQtRC94LMgy0Cn8Kfwp/CrQK6QqMCjUQrRDNDkkOpgrcCkgLSAvCC5wLbQseC38KfwrpCkgLdxDiDcEKHgseC0gLSAtIC20LbQtIC20LbQttC5MLSAs2FDkT1QhoDc0Olw0TDR4L7gyXDU4MUQucCbcJwQptC3sNZQ4yDH0MHQ3nC4cMhwylC5AMDQxtC20LfwrsCYIJpQvCC+kK6Qq0CukKHguc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AAYAAAANAAAAAgAAAAoAAAAFAAAAAAAAAAAAAAAAQMpFG0z/UoJas2Kia2B1AgEAGRcCAH58d21XKRMJBAIAAEHE8QEL/AMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
if (!isDataURI(wasmBinaryFile)) {
  wasmBinaryFile = locateFile(wasmBinaryFile);
}

function getBinary() {
  try {
    if (wasmBinary) {
      return new Uint8Array(wasmBinary);
    }

    var binary = tryParseAsDataURI(wasmBinaryFile);
    if (binary) {
      return binary;
    }
    if (readBinary) {
      return readBinary(wasmBinaryFile);
    } else {
      throw "both async and sync fetching of the wasm failed";
    }
  }
  catch (err) {
    abort(err);
  }
}

function getBinaryPromise() {
  // if we don't have the binary yet, and have the Fetch api, use that
  // in some environments, like Electron's render process, Fetch api may be present, but have a different context than expected, let's only use it on the Web
  if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && typeof fetch === 'function') {
    return fetch(wasmBinaryFile, { credentials: 'same-origin' }).then(function(response) {
      if (!response['ok']) {
        throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
      }
      return response['arrayBuffer']();
    }).catch(function () {
      return getBinary();
    });
  }
  // Otherwise, getBinary should be able to get it synchronously
  return new Promise(function(resolve, reject) {
    resolve(getBinary());
  });
}



// Create the wasm instance.
// Receives the wasm imports, returns the exports.
function createWasm() {
  // prepare imports
  var info = {
    'env': asmLibraryArg,
    'wasi_snapshot_preview1': asmLibraryArg
  };
  // Load the wasm module and create an instance of using native support in the JS engine.
  // handle a generated wasm instance, receiving its exports and
  // performing other necessary setup
  function receiveInstance(instance, module) {
    var exports = instance.exports;
    Module['asm'] = exports;
    removeRunDependency('wasm-instantiate');
  }
   // we can't run yet (except in a pthread, where we have a custom sync instantiator)
  addRunDependency('wasm-instantiate');


  // Async compilation can be confusing when an error on the page overwrites Module
  // (for example, if the order of elements is wrong, and the one defining Module is
  // later), so we save Module and check it later.
  var trueModule = Module;
  function receiveInstantiatedSource(output) {
    // 'output' is a WebAssemblyInstantiatedSource object which has both the module and instance.
    // receiveInstance() will swap in the exports (to Module.asm) so they can be called
    assert(Module === trueModule, 'the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?');
    trueModule = null;
      // TODO: Due to Closure regression https://github.com/google/closure-compiler/issues/3193, the above line no longer optimizes out down to the following line.
      // When the regression is fixed, can restore the above USE_PTHREADS-enabled path.
    receiveInstance(output['instance']);
  }


  function instantiateArrayBuffer(receiver) {
    return getBinaryPromise().then(function(binary) {
      return WebAssembly.instantiate(binary, info);
    }).then(receiver, function(reason) {
      err('failed to asynchronously prepare wasm: ' + reason);
      abort(reason);
    });
  }

  // Prefer streaming instantiation if available.
  function instantiateAsync() {
    if (!wasmBinary &&
        typeof WebAssembly.instantiateStreaming === 'function' &&
        !isDataURI(wasmBinaryFile) &&
        typeof fetch === 'function') {
      fetch(wasmBinaryFile, { credentials: 'same-origin' }).then(function (response) {
        var result = WebAssembly.instantiateStreaming(response, info);
        return result.then(receiveInstantiatedSource, function(reason) {
            // We expect the most common failure cause to be a bad MIME type for the binary,
            // in which case falling back to ArrayBuffer instantiation should work.
            err('wasm streaming compile failed: ' + reason);
            err('falling back to ArrayBuffer instantiation');
            instantiateArrayBuffer(receiveInstantiatedSource);
          });
      });
    } else {
      return instantiateArrayBuffer(receiveInstantiatedSource);
    }
  }
  // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
  // to manually instantiate the Wasm module themselves. This allows pages to run the instantiation parallel
  // to any other async startup actions they are performing.
  if (Module['instantiateWasm']) {
    try {
      var exports = Module['instantiateWasm'](info, receiveInstance);
      return exports;
    } catch(e) {
      err('Module.instantiateWasm callback failed with error: ' + e);
      return false;
    }
  }

  instantiateAsync();
  return {}; // no exports yet; we'll fill them in later
}


// Globals used by JS i64 conversions
var tempDouble;
var tempI64;

// === Body ===

var ASM_CONSTS = {
  
};




// STATICTOP = STATIC_BASE + 30560;
/* global initializers */  __ATINIT__.push({ func: function() { ___wasm_call_ctors() } });




/* no memory initializer */
// {{PRE_LIBRARY}}


  function demangle(func) {
      warnOnce('warning: build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling');
      return func;
    }

  function demangleAll(text) {
      var regex =
        /\b_Z[\w\d_]+/g;
      return text.replace(regex,
        function(x) {
          var y = demangle(x);
          return x === y ? x : (y + ' [' + x + ']');
        });
    }

  function jsStackTrace() {
      var err = new Error();
      if (!err.stack) {
        // IE10+ special cases: It does have callstack info, but it is only populated if an Error object is thrown,
        // so try that as a special-case.
        try {
          throw new Error();
        } catch(e) {
          err = e;
        }
        if (!err.stack) {
          return '(no stack trace available)';
        }
      }
      return err.stack.toString();
    }

  function stackTrace() {
      var js = jsStackTrace();
      if (Module['extraStackTrace']) js += '\n' + Module['extraStackTrace']();
      return demangleAll(js);
    }

  function ___handle_stack_overflow() {
      abort('stack overflow')
    }

  function _emscripten_get_heap_size() {
      return HEAP8.length;
    }

  function _emscripten_get_sbrk_ptr() {
      return 31424;
    }

  function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.set(HEAPU8.subarray(src, src+num), dest);
    }

  
  function abortOnCannotGrowMemory(requestedSize) {
      abort('Cannot enlarge memory arrays to size ' + requestedSize + ' bytes (OOM). Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value ' + HEAP8.length + ', (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which allows increasing the size at runtime, or (3) if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ');
    }function _emscripten_resize_heap(requestedSize) {
      abortOnCannotGrowMemory(requestedSize);
    }

  
  function _memcpy(dest, src, num) {
      dest = dest|0; src = src|0; num = num|0;
      var ret = 0;
      var aligned_dest_end = 0;
      var block_aligned_dest_end = 0;
      var dest_end = 0;
      // Test against a benchmarked cutoff limit for when HEAPU8.set() becomes faster to use.
      if ((num|0) >= 8192) {
        _emscripten_memcpy_big(dest|0, src|0, num|0)|0;
        return dest|0;
      }
  
      ret = dest|0;
      dest_end = (dest + num)|0;
      if ((dest&3) == (src&3)) {
        // The initial unaligned < 4-byte front.
        while (dest & 3) {
          if ((num|0) == 0) return ret|0;
          HEAP8[((dest)>>0)]=((HEAP8[((src)>>0)])|0);
          dest = (dest+1)|0;
          src = (src+1)|0;
          num = (num-1)|0;
        }
        aligned_dest_end = (dest_end & -4)|0;
        block_aligned_dest_end = (aligned_dest_end - 64)|0;
        while ((dest|0) <= (block_aligned_dest_end|0) ) {
          HEAP32[((dest)>>2)]=((HEAP32[((src)>>2)])|0);
          HEAP32[(((dest)+(4))>>2)]=((HEAP32[(((src)+(4))>>2)])|0);
          HEAP32[(((dest)+(8))>>2)]=((HEAP32[(((src)+(8))>>2)])|0);
          HEAP32[(((dest)+(12))>>2)]=((HEAP32[(((src)+(12))>>2)])|0);
          HEAP32[(((dest)+(16))>>2)]=((HEAP32[(((src)+(16))>>2)])|0);
          HEAP32[(((dest)+(20))>>2)]=((HEAP32[(((src)+(20))>>2)])|0);
          HEAP32[(((dest)+(24))>>2)]=((HEAP32[(((src)+(24))>>2)])|0);
          HEAP32[(((dest)+(28))>>2)]=((HEAP32[(((src)+(28))>>2)])|0);
          HEAP32[(((dest)+(32))>>2)]=((HEAP32[(((src)+(32))>>2)])|0);
          HEAP32[(((dest)+(36))>>2)]=((HEAP32[(((src)+(36))>>2)])|0);
          HEAP32[(((dest)+(40))>>2)]=((HEAP32[(((src)+(40))>>2)])|0);
          HEAP32[(((dest)+(44))>>2)]=((HEAP32[(((src)+(44))>>2)])|0);
          HEAP32[(((dest)+(48))>>2)]=((HEAP32[(((src)+(48))>>2)])|0);
          HEAP32[(((dest)+(52))>>2)]=((HEAP32[(((src)+(52))>>2)])|0);
          HEAP32[(((dest)+(56))>>2)]=((HEAP32[(((src)+(56))>>2)])|0);
          HEAP32[(((dest)+(60))>>2)]=((HEAP32[(((src)+(60))>>2)])|0);
          dest = (dest+64)|0;
          src = (src+64)|0;
        }
        while ((dest|0) < (aligned_dest_end|0) ) {
          HEAP32[((dest)>>2)]=((HEAP32[((src)>>2)])|0);
          dest = (dest+4)|0;
          src = (src+4)|0;
        }
      } else {
        // In the unaligned copy case, unroll a bit as well.
        aligned_dest_end = (dest_end - 4)|0;
        while ((dest|0) < (aligned_dest_end|0) ) {
          HEAP8[((dest)>>0)]=((HEAP8[((src)>>0)])|0);
          HEAP8[(((dest)+(1))>>0)]=((HEAP8[(((src)+(1))>>0)])|0);
          HEAP8[(((dest)+(2))>>0)]=((HEAP8[(((src)+(2))>>0)])|0);
          HEAP8[(((dest)+(3))>>0)]=((HEAP8[(((src)+(3))>>0)])|0);
          dest = (dest+4)|0;
          src = (src+4)|0;
        }
      }
      // The remaining unaligned < 4 byte tail.
      while ((dest|0) < (dest_end|0)) {
        HEAP8[((dest)>>0)]=((HEAP8[((src)>>0)])|0);
        dest = (dest+1)|0;
        src = (src+1)|0;
      }
      return ret|0;
    }

  function _memset(ptr, value, num) {
      ptr = ptr|0; value = value|0; num = num|0;
      var end = 0, aligned_end = 0, block_aligned_end = 0, value4 = 0;
      end = (ptr + num)|0;
  
      value = value & 0xff;
      if ((num|0) >= 67 /* 64 bytes for an unrolled loop + 3 bytes for unaligned head*/) {
        while ((ptr&3) != 0) {
          HEAP8[((ptr)>>0)]=value;
          ptr = (ptr+1)|0;
        }
  
        aligned_end = (end & -4)|0;
        value4 = value | (value << 8) | (value << 16) | (value << 24);
  
        block_aligned_end = (aligned_end - 64)|0;
  
        while((ptr|0) <= (block_aligned_end|0)) {
          HEAP32[((ptr)>>2)]=value4;
          HEAP32[(((ptr)+(4))>>2)]=value4;
          HEAP32[(((ptr)+(8))>>2)]=value4;
          HEAP32[(((ptr)+(12))>>2)]=value4;
          HEAP32[(((ptr)+(16))>>2)]=value4;
          HEAP32[(((ptr)+(20))>>2)]=value4;
          HEAP32[(((ptr)+(24))>>2)]=value4;
          HEAP32[(((ptr)+(28))>>2)]=value4;
          HEAP32[(((ptr)+(32))>>2)]=value4;
          HEAP32[(((ptr)+(36))>>2)]=value4;
          HEAP32[(((ptr)+(40))>>2)]=value4;
          HEAP32[(((ptr)+(44))>>2)]=value4;
          HEAP32[(((ptr)+(48))>>2)]=value4;
          HEAP32[(((ptr)+(52))>>2)]=value4;
          HEAP32[(((ptr)+(56))>>2)]=value4;
          HEAP32[(((ptr)+(60))>>2)]=value4;
          ptr = (ptr + 64)|0;
        }
  
        while ((ptr|0) < (aligned_end|0) ) {
          HEAP32[((ptr)>>2)]=value4;
          ptr = (ptr+4)|0;
        }
      }
      // The remaining bytes.
      while ((ptr|0) < (end|0)) {
        HEAP8[((ptr)>>0)]=value;
        ptr = (ptr+1)|0;
      }
      return (end-num)|0;
    }
var ASSERTIONS = true;

// Copyright 2017 The Emscripten Authors.  All rights reserved.
// Emscripten is available under two separate licenses, the MIT license and the
// University of Illinois/NCSA Open Source License.  Both these licenses can be
// found in the LICENSE file.

/** @type {function(string, boolean=, number=)} */
function intArrayFromString(stringy, dontAddNull, length) {
  var len = length > 0 ? length : lengthBytesUTF8(stringy)+1;
  var u8array = new Array(len);
  var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
  if (dontAddNull) u8array.length = numBytesWritten;
  return u8array;
}

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      if (ASSERTIONS) {
        assert(false, 'Character code ' + chr + ' (' + String.fromCharCode(chr) + ')  at offset ' + i + ' not in 0x00-0xFF.');
      }
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}


// Copied from https://github.com/strophe/strophejs/blob/e06d027/src/polyfills.js#L149

// This code was written by Tyler Akins and has been placed in the
// public domain.  It would be nice if you left this header intact.
// Base64 code from Tyler Akins -- http://rumkin.com

/**
 * Decodes a base64 string.
 * @param {String} input The string to decode.
 */
var decodeBase64 = typeof atob === 'function' ? atob : function (input) {
  var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

  var output = '';
  var chr1, chr2, chr3;
  var enc1, enc2, enc3, enc4;
  var i = 0;
  // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
  input = input.replace(/[^A-Za-z0-9\+\/\=]/g, '');
  do {
    enc1 = keyStr.indexOf(input.charAt(i++));
    enc2 = keyStr.indexOf(input.charAt(i++));
    enc3 = keyStr.indexOf(input.charAt(i++));
    enc4 = keyStr.indexOf(input.charAt(i++));

    chr1 = (enc1 << 2) | (enc2 >> 4);
    chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    chr3 = ((enc3 & 3) << 6) | enc4;

    output = output + String.fromCharCode(chr1);

    if (enc3 !== 64) {
      output = output + String.fromCharCode(chr2);
    }
    if (enc4 !== 64) {
      output = output + String.fromCharCode(chr3);
    }
  } while (i < input.length);
  return output;
};

// Converts a string of base64 into a byte array.
// Throws error on invalid input.
function intArrayFromBase64(s) {
  if (typeof ENVIRONMENT_IS_NODE === 'boolean' && ENVIRONMENT_IS_NODE) {
    var buf;
    try {
      buf = Buffer.from(s, 'base64');
    } catch (_) {
      buf = new Buffer(s, 'base64');
    }
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  }

  try {
    var decoded = decodeBase64(s);
    var bytes = new Uint8Array(decoded.length);
    for (var i = 0 ; i < decoded.length ; ++i) {
      bytes[i] = decoded.charCodeAt(i);
    }
    return bytes;
  } catch (_) {
    throw new Error('Converting base64 string to bytes failed.');
  }
}

// If filename is a base64 data URI, parses and returns data (Buffer on node,
// Uint8Array otherwise). If filename is not a base64 data URI, returns undefined.
function tryParseAsDataURI(filename) {
  if (!isDataURI(filename)) {
    return;
  }

  return intArrayFromBase64(filename.slice(dataURIPrefix.length));
}


// ASM_LIBRARY EXTERN PRIMITIVES: Int8Array,Int32Array

var asmGlobalArg = {};
var asmLibraryArg = { "__handle_stack_overflow": ___handle_stack_overflow, "emscripten_get_sbrk_ptr": _emscripten_get_sbrk_ptr, "emscripten_memcpy_big": _emscripten_memcpy_big, "emscripten_resize_heap": _emscripten_resize_heap, "memory": wasmMemory, "table": wasmTable };
var asm = createWasm();
Module["asm"] = asm;
var ___wasm_call_ctors = Module["___wasm_call_ctors"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__wasm_call_ctors"].apply(null, arguments)
};

var _opus_decoder_create = Module["_opus_decoder_create"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["opus_decoder_create"].apply(null, arguments)
};

var _opus_decode_float = Module["_opus_decode_float"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["opus_decode_float"].apply(null, arguments)
};

var _opus_decoder_ctl = Module["_opus_decoder_ctl"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["opus_decoder_ctl"].apply(null, arguments)
};

var _opus_decoder_destroy = Module["_opus_decoder_destroy"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["opus_decoder_destroy"].apply(null, arguments)
};

var _setThrew = Module["_setThrew"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["setThrew"].apply(null, arguments)
};

var _malloc = Module["_malloc"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["malloc"].apply(null, arguments)
};

var _free = Module["_free"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["free"].apply(null, arguments)
};

var ___set_stack_limit = Module["___set_stack_limit"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__set_stack_limit"].apply(null, arguments)
};

var stackSave = Module["stackSave"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["stackSave"].apply(null, arguments)
};

var stackAlloc = Module["stackAlloc"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["stackAlloc"].apply(null, arguments)
};

var stackRestore = Module["stackRestore"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["stackRestore"].apply(null, arguments)
};

var __growWasmMemory = Module["__growWasmMemory"] = function() {
  assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
  assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
  return Module["asm"]["__growWasmMemory"].apply(null, arguments)
};




// === Auto-generated postamble setup entry stuff ===

Module['asm'] = asm;

if (!Object.getOwnPropertyDescriptor(Module, "intArrayFromString")) Module["intArrayFromString"] = function() { abort("'intArrayFromString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "intArrayToString")) Module["intArrayToString"] = function() { abort("'intArrayToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "ccall")) Module["ccall"] = function() { abort("'ccall' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "cwrap")) Module["cwrap"] = function() { abort("'cwrap' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
Module["setValue"] = setValue;
Module["getValue"] = getValue;
if (!Object.getOwnPropertyDescriptor(Module, "allocate")) Module["allocate"] = function() { abort("'allocate' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "getMemory")) Module["getMemory"] = function() { abort("'getMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Object.getOwnPropertyDescriptor(Module, "AsciiToString")) Module["AsciiToString"] = function() { abort("'AsciiToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "stringToAscii")) Module["stringToAscii"] = function() { abort("'stringToAscii' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "UTF8ArrayToString")) Module["UTF8ArrayToString"] = function() { abort("'UTF8ArrayToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "UTF8ToString")) Module["UTF8ToString"] = function() { abort("'UTF8ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF8Array")) Module["stringToUTF8Array"] = function() { abort("'stringToUTF8Array' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF8")) Module["stringToUTF8"] = function() { abort("'stringToUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "lengthBytesUTF8")) Module["lengthBytesUTF8"] = function() { abort("'lengthBytesUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "UTF16ToString")) Module["UTF16ToString"] = function() { abort("'UTF16ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF16")) Module["stringToUTF16"] = function() { abort("'stringToUTF16' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "lengthBytesUTF16")) Module["lengthBytesUTF16"] = function() { abort("'lengthBytesUTF16' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "UTF32ToString")) Module["UTF32ToString"] = function() { abort("'UTF32ToString' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "stringToUTF32")) Module["stringToUTF32"] = function() { abort("'stringToUTF32' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "lengthBytesUTF32")) Module["lengthBytesUTF32"] = function() { abort("'lengthBytesUTF32' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "allocateUTF8")) Module["allocateUTF8"] = function() { abort("'allocateUTF8' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "allocateUTF8OnStack")) Module["allocateUTF8OnStack"] = function() { abort("'allocateUTF8OnStack' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "stackTrace")) Module["stackTrace"] = function() { abort("'stackTrace' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "addOnPreRun")) Module["addOnPreRun"] = function() { abort("'addOnPreRun' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "addOnInit")) Module["addOnInit"] = function() { abort("'addOnInit' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "addOnPreMain")) Module["addOnPreMain"] = function() { abort("'addOnPreMain' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "addOnExit")) Module["addOnExit"] = function() { abort("'addOnExit' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "addOnPostRun")) Module["addOnPostRun"] = function() { abort("'addOnPostRun' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "writeStringToMemory")) Module["writeStringToMemory"] = function() { abort("'writeStringToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "writeArrayToMemory")) Module["writeArrayToMemory"] = function() { abort("'writeArrayToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "writeAsciiToMemory")) Module["writeAsciiToMemory"] = function() { abort("'writeAsciiToMemory' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "addRunDependency")) Module["addRunDependency"] = function() { abort("'addRunDependency' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Object.getOwnPropertyDescriptor(Module, "removeRunDependency")) Module["removeRunDependency"] = function() { abort("'removeRunDependency' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Object.getOwnPropertyDescriptor(Module, "ENV")) Module["ENV"] = function() { abort("'ENV' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "FS")) Module["FS"] = function() { abort("'FS' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "FS_createFolder")) Module["FS_createFolder"] = function() { abort("'FS_createFolder' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Object.getOwnPropertyDescriptor(Module, "FS_createPath")) Module["FS_createPath"] = function() { abort("'FS_createPath' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Object.getOwnPropertyDescriptor(Module, "FS_createDataFile")) Module["FS_createDataFile"] = function() { abort("'FS_createDataFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Object.getOwnPropertyDescriptor(Module, "FS_createPreloadedFile")) Module["FS_createPreloadedFile"] = function() { abort("'FS_createPreloadedFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Object.getOwnPropertyDescriptor(Module, "FS_createLazyFile")) Module["FS_createLazyFile"] = function() { abort("'FS_createLazyFile' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Object.getOwnPropertyDescriptor(Module, "FS_createLink")) Module["FS_createLink"] = function() { abort("'FS_createLink' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Object.getOwnPropertyDescriptor(Module, "FS_createDevice")) Module["FS_createDevice"] = function() { abort("'FS_createDevice' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Object.getOwnPropertyDescriptor(Module, "FS_unlink")) Module["FS_unlink"] = function() { abort("'FS_unlink' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") };
if (!Object.getOwnPropertyDescriptor(Module, "GL")) Module["GL"] = function() { abort("'GL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "dynamicAlloc")) Module["dynamicAlloc"] = function() { abort("'dynamicAlloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "loadDynamicLibrary")) Module["loadDynamicLibrary"] = function() { abort("'loadDynamicLibrary' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "loadWebAssemblyModule")) Module["loadWebAssemblyModule"] = function() { abort("'loadWebAssemblyModule' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "getLEB")) Module["getLEB"] = function() { abort("'getLEB' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "getFunctionTables")) Module["getFunctionTables"] = function() { abort("'getFunctionTables' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "alignFunctionTables")) Module["alignFunctionTables"] = function() { abort("'alignFunctionTables' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "registerFunctions")) Module["registerFunctions"] = function() { abort("'registerFunctions' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "addFunction")) Module["addFunction"] = function() { abort("'addFunction' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "removeFunction")) Module["removeFunction"] = function() { abort("'removeFunction' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "getFuncWrapper")) Module["getFuncWrapper"] = function() { abort("'getFuncWrapper' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "prettyPrint")) Module["prettyPrint"] = function() { abort("'prettyPrint' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "makeBigInt")) Module["makeBigInt"] = function() { abort("'makeBigInt' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "dynCall")) Module["dynCall"] = function() { abort("'dynCall' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "getCompilerSetting")) Module["getCompilerSetting"] = function() { abort("'getCompilerSetting' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "print")) Module["print"] = function() { abort("'print' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "printErr")) Module["printErr"] = function() { abort("'printErr' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "getTempRet0")) Module["getTempRet0"] = function() { abort("'getTempRet0' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "setTempRet0")) Module["setTempRet0"] = function() { abort("'setTempRet0' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "callMain")) Module["callMain"] = function() { abort("'callMain' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "abort")) Module["abort"] = function() { abort("'abort' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "warnOnce")) Module["warnOnce"] = function() { abort("'warnOnce' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "stackSave")) Module["stackSave"] = function() { abort("'stackSave' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "stackRestore")) Module["stackRestore"] = function() { abort("'stackRestore' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "stackAlloc")) Module["stackAlloc"] = function() { abort("'stackAlloc' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
Module["writeStackCookie"] = writeStackCookie;
Module["checkStackCookie"] = checkStackCookie;
Module["abortStackOverflow"] = abortStackOverflow;
if (!Object.getOwnPropertyDescriptor(Module, "intArrayFromBase64")) Module["intArrayFromBase64"] = function() { abort("'intArrayFromBase64' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };
if (!Object.getOwnPropertyDescriptor(Module, "tryParseAsDataURI")) Module["tryParseAsDataURI"] = function() { abort("'tryParseAsDataURI' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") };if (!Object.getOwnPropertyDescriptor(Module, "ALLOC_NORMAL")) Object.defineProperty(Module, "ALLOC_NORMAL", { configurable: true, get: function() { abort("'ALLOC_NORMAL' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") } });
if (!Object.getOwnPropertyDescriptor(Module, "ALLOC_STACK")) Object.defineProperty(Module, "ALLOC_STACK", { configurable: true, get: function() { abort("'ALLOC_STACK' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") } });
if (!Object.getOwnPropertyDescriptor(Module, "ALLOC_DYNAMIC")) Object.defineProperty(Module, "ALLOC_DYNAMIC", { configurable: true, get: function() { abort("'ALLOC_DYNAMIC' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") } });
if (!Object.getOwnPropertyDescriptor(Module, "ALLOC_NONE")) Object.defineProperty(Module, "ALLOC_NONE", { configurable: true, get: function() { abort("'ALLOC_NONE' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ)") } });
if (!Object.getOwnPropertyDescriptor(Module, "calledRun")) Object.defineProperty(Module, "calledRun", { configurable: true, get: function() { abort("'calledRun' was not exported. add it to EXTRA_EXPORTED_RUNTIME_METHODS (see the FAQ). Alternatively, forcing filesystem support (-s FORCE_FILESYSTEM=1) can export this for you") } });



var calledRun;

// Modularize mode returns a function, which can be called to
// create instances. The instances provide a then() method,
// must like a Promise, that receives a callback. The callback
// is called when the module is ready to run, with the module
// as a parameter. (Like a Promise, it also returns the module
// so you can use the output of .then(..)).
Module['then'] = function(func) {
  // We may already be ready to run code at this time. if
  // so, just queue a call to the callback.
  if (calledRun) {
    func(Module);
  } else {
    // we are not ready to call then() yet. we must call it
    // at the same time we would call onRuntimeInitialized.
    var old = Module['onRuntimeInitialized'];
    Module['onRuntimeInitialized'] = function() {
      if (old) old();
      func(Module);
    };
  }
  return Module;
};

/**
 * @constructor
 * @this {ExitStatus}
 */
function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
}

var calledMain = false;


dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!calledRun) run();
  if (!calledRun) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
};





/** @type {function(Array=)} */
function run(args) {
  args = args || arguments_;

  if (runDependencies > 0) {
    return;
  }

  writeStackCookie();

  preRun();

  if (runDependencies > 0) return; // a preRun added a dependency, run will be called later

  function doRun() {
    // run may have just been called through dependencies being fulfilled just in this very frame,
    // or while the async setStatus time below was happening
    if (calledRun) return;
    calledRun = true;

    if (ABORT) return;

    initRuntime();

    preMain();

    if (Module['onRuntimeInitialized']) Module['onRuntimeInitialized']();

    assert(!Module['_main'], 'compiled without a main, but one is present. if you added it from JS, use Module["onRuntimeInitialized"]');

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
  } else
  {
    doRun();
  }
  checkStackCookie();
}
Module['run'] = run;

function checkUnflushedContent() {
  // Compiler settings do not allow exiting the runtime, so flushing
  // the streams is not possible. but in ASSERTIONS mode we check
  // if there was something to flush, and if so tell the user they
  // should request that the runtime be exitable.
  // Normally we would not even include flush() at all, but in ASSERTIONS
  // builds we do so just for this check, and here we see if there is any
  // content to flush, that is, we check if there would have been
  // something a non-ASSERTIONS build would have not seen.
  // How we flush the streams depends on whether we are in SYSCALLS_REQUIRE_FILESYSTEM=0
  // mode (which has its own special function for this; otherwise, all
  // the code is inside libc)
  var print = out;
  var printErr = err;
  var has = false;
  out = err = function(x) {
    has = true;
  }
  try { // it doesn't matter if it fails
    var flush = null;
    if (flush) flush(0);
  } catch(e) {}
  out = print;
  err = printErr;
  if (has) {
    warnOnce('stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the FAQ), or make sure to emit a newline when you printf etc.');
    warnOnce('(this may also be due to not including full filesystem support - try building with -s FORCE_FILESYSTEM=1)');
  }
}

function exit(status, implicit) {
  checkUnflushedContent();

  // if this is just main exit-ing implicitly, and the status is 0, then we
  // don't need to do anything here and can just leave. if the status is
  // non-zero, though, then we need to report it.
  // (we may have warned about this earlier, if a situation justifies doing so)
  if (implicit && noExitRuntime && status === 0) {
    return;
  }

  if (noExitRuntime) {
    // if exit() was called, we may warn the user if the runtime isn't actually being shut down
    if (!implicit) {
      err('program exited (with status: ' + status + '), but EXIT_RUNTIME is not set, so halting execution but not exiting the runtime or preventing further async execution (build with EXIT_RUNTIME=1, if you want a true shutdown)');
    }
  } else {

    ABORT = true;
    EXITSTATUS = status;

    exitRuntime();

    if (Module['onExit']) Module['onExit'](status);
  }

  quit_(status, new ExitStatus(status));
}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}


  noExitRuntime = true;

run();





// {{MODULE_ADDITIONS}}





  return Opus
}
);
})();
export default Opus;