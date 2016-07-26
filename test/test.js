import 'babel-polyfill';
import createEngine, { EVENTS } from '../src';
import toMessages from 'fluxgear-tomessages';
import expect from 'must';
import sinon from 'sinon';
import mustSinon from 'must-sinon';
mustSinon(expect);

const makeMethods = () => {
  const methods = {
    *transformer(message) {
      yield message;
    },
    consumer() {
    },
    reducer(state) {
      return state;
    },
  };
  sinon.spy(methods, 'transformer');
  sinon.spy(methods, 'consumer');
  sinon.spy(methods, 'reducer');
  return methods;
};

const MESSAGES = [
  'EVENT',
  'MESSAGE1',
  'MESSAGE2',
]::toMessages();

const MATCHES = {
  INIT: sinon.match({ type: EVENTS.INIT }),
  CHANGE: sinon.match({ type: EVENTS.CHANGE }),
  EVENT: sinon.match({ type: MESSAGES.EVENT }),
  MESSAGE1: sinon.match({ type: MESSAGES.MESSAGE1 }),
  MESSAGE2: sinon.match({ type: MESSAGES.MESSAGE2 }),
};

describe('engine', () => {
  it('has dispatch, getState and subscribe', () => {
    const engine = createEngine();
    expect(engine).to.be.truthy();
    expect(engine.dispatch).to.be.a.function();
    expect(engine.getState).to.be.a.function();
    expect(engine.subscribe).to.be.a.function();
  });
  it('dispatches INIT event', () => {
    const methods = makeMethods();
    createEngine({
      ...methods,
    });
    expect(methods.transformer).to.have.been.calledWith(MATCHES.INIT);
    expect(methods.consumer).to.have.been.calledWith(MATCHES.INIT);
    expect(methods.reducer).to.have.been.calledWith(sinon.match.any, MATCHES.INIT);
  });
  it('uses initialState', () => {
    const initialState = { initialState: true };
    const engine = createEngine({
      initialState,
    });
    expect(engine.getState()).to.eql(initialState);
  });
  it('doesn\'t call consumer with CHANGE if no state change', () => {
    const initialState = false;
    const methods = makeMethods();
    const engine = createEngine({
      ...methods,
      initialState,
    });
    expect(engine.getState()).to.eql(initialState);
    expect(methods.transformer).to.have.been.calledWith(MATCHES.INIT);
    expect(methods.transformer).not.to.have.been.calledWith(MATCHES.CHANGE);
    expect(methods.consumer).to.have.been.calledWith(MATCHES.INIT);
    expect(methods.consumer).not.to.have.been.calledWith(MATCHES.CHANGE);
    expect(methods.reducer).to.have.been.calledWith(sinon.match.any, MATCHES.INIT);
    expect(methods.reducer).not.to.have.been.calledWith(sinon.match.any, MATCHES.CHANGE);
  });
  it('calls consumer with CHANGE after state change', () => {
    const initialState = false;
    const methods = makeMethods();
    methods.reducer.restore();
    sinon.stub(methods, 'reducer').returns(true);
    const engine = createEngine({
      ...methods,
      initialState,
    });
    expect(engine.getState()).not.to.eql(initialState);
    expect(methods.transformer).to.have.been.calledWith(MATCHES.INIT);
    expect(methods.transformer).not.to.have.been.calledWith(MATCHES.CHANGE);
    expect(methods.consumer).to.have.been.calledWith(MATCHES.INIT);
    expect(methods.consumer).to.have.been.calledWith(MATCHES.CHANGE);
    expect(methods.reducer).to.have.been.calledWith(sinon.match.any, MATCHES.INIT);
    expect(methods.reducer).not.to.have.been.calledWith(sinon.match.any, MATCHES.CHANGE);
  });
  it('transform events, consume and reduce messages', () => {
    const methods = makeMethods();
    methods.transformer.restore();
    sinon.stub(methods, 'transformer', function* transformer(event) {
      if (event.type === MESSAGES.EVENT) {
        yield { type: MESSAGES.MESSAGE1 };
        yield { type: MESSAGES.MESSAGE2 };
      } else {
        yield event;
      }
    });
    const engine = createEngine({
      ...methods,
    });
    engine.dispatch({ type: MESSAGES.EVENT });
    expect(methods.transformer).to.have.been.calledWith(MATCHES.EVENT);
    expect(methods.transformer).not.to.have.been.calledWith(MATCHES.MESSAGE1);
    expect(methods.transformer).not.to.have.been.calledWith(MATCHES.MESSAGE2);
    expect(methods.consumer).not.to.have.been.calledWith(MATCHES.EVENT);
    expect(methods.consumer).to.have.been.calledWith(MATCHES.MESSAGE1);
    expect(methods.consumer).to.have.been.calledWith(MATCHES.MESSAGE2);
    expect(methods.reducer).not.to.have.been.calledWith(sinon.match.any, MATCHES.EVENT);
    expect(methods.reducer).to.have.been.calledWith(sinon.match.any, MATCHES.MESSAGE1);
    expect(methods.reducer).to.have.been.calledWith(sinon.match.any, MATCHES.MESSAGE2);
  });
  it('throws if dispatch isn\'t called with event with "type" property', () => {
    const engine = createEngine();
    expect(() => {
      engine.dispatch({});
    }).to.throw();
  });
  it('calls dispatch with expected arguments', () => {
    const methods = makeMethods();
    methods.consumer.restore();
    sinon.stub(methods, 'consumer', (event, options) => {
      expect(options).to.have.property('getDependencies');
      expect(options).to.have.property('getState');
      expect(options).to.have.property('getApiProps');
      expect(options).to.have.property('dispatch');
    });
    createEngine({
      ...methods,
      reducer: state => !state,
    });
    expect(methods.consumer).to.have.been.calledTwice();
  });
  it('throws if dispatch is called synchronously in consume', () => {
    const methods = makeMethods();
    methods.consumer.restore();
    sinon.stub(methods, 'consumer', (event, { dispatch }) => {
      expect(() => {
        dispatch({ type: MESSAGES.EVENT });
      }).to.throw();
    });
    createEngine({
      ...methods,
    });
    expect(methods.consumer).to.have.been.calledOnce();
  });
});
