import chai, { assert, expect } from 'chai';
import {jsdom} from 'jsdom';
import chaiEnzyme from 'chai-enzyme';
import { TestScheduler } from 'rxjs';
import proxyquire from 'proxyquire';
import path from 'path';
import globalMocks from './mocks';

// chai should extends prototype of object with should
// http://chaijs.com/guide/styles/#should
chai.should();
chai.use(chaiEnzyme());

var exposedProperties = ['window', 'navigator', 'document'];

global.document = jsdom('');
global.window = document.defaultView;
Object.keys(document.defaultView).forEach(function(property) {
  if (typeof global[property] === 'undefined') {
    exposedProperties.push(property);
    global[property] = document.defaultView[property];
  }
});

global.navigator = {
  userAgent: 'node.js'
};

global.expect = expect;

const ts = new TestScheduler(assert.deepEqual);
global.hot = ts.createHotObservable.bind(ts);
global.cold = ts.createColdObservable.bind(ts);
global.expectObservable = ts.expectObservable.bind(ts);

// to test observables we need to flush after every it (), and if we forget it we get a false positive
afterEach(() => {
  ts.flush();
});

const parsedGlobalMocks = Object.keys(globalMocks).reduce((reducedGlobalMocks, moduleName) => {
  reducedGlobalMocks[moduleName] = Object.assign({}, globalMocks[moduleName], {'@global': true});
  return reducedGlobalMocks;
}, {});

const proxyquireStrict = proxyquire.noCallThru();

global.rootImport = (module, mocks = {}) => {
  const modulePath = path.relative(__dirname, path.join(__dirname, '..', module));
  try {
    const mockModules = Object.assign({}, parsedGlobalMocks, mocks);
    const parsedMockModules = Object.keys(mockModules).reduce((reducedParsedMockModules, modulePath) => {
      if(path.isAbsolute(modulePath)) {
        const absolutePath = path.join(__dirname, '..', modulePath);
        reducedParsedMockModules[absolutePath] = mockModules[modulePath];
      }else{
        reducedParsedMockModules[modulePath] = mockModules[modulePath];
      }
      return reducedParsedMockModules;
    }, {})
    const mock = proxyquireStrict(modulePath, parsedMockModules);
    return mock;
  } catch(e) {
    const stack = e.stack.split('\n');
    const [first] = stack;
    const moduleError = first.match(/Cannot find module '(.*?)'/);
    if(moduleError) {
      const moduleChain = stack
        .map(error => error.match(/at Object.<anonymous> \((.*?):\d+:\d+\)/))
        .filter(match => match)
        .map(match => match[1])
        //.reverse()
        .map(file => `\nin '${file}'`)
        .join('');
      const errorMessage = `\n\ncan't resolve '${moduleError[1]}'${moduleChain}`;
      const newError = new Error(errorMessage);
      newError.stack = newError.stack = errorMessage;
      throw newError;
    }
    throw e;
  }
}

global.rootImportDefault = (module, mocks ={}) => global.rootImport(module, mocks).default;
