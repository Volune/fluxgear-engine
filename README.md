# 'fluxgear-engine'

Engine, handle dispatched events and maintain state

Part of the `fluxgear` project

## Example

```
import createEngine from 'fluxgear-engine';

const engine = createEngine({
  *transformer(event) {
    switch(event.type) {
      case 'BUTTON_CLICKED':
        yield { type: 'EVENT_LOGGED', msg: 'clicked' };
        yield { type: 'COUNTER_INCREMENTED' };
      default:
    }
  },
  consumer(event) {
    switch(event.type) {
      case 'EVENT_LOGGED':
        console.log(event.msg);
      default:
    }
  },
  reducer(state, event) {
    switch(event.type) {
      case 'COUNTER_INCREMENTED':
        return {
          ...state,
          counter: state.counter + 1,
        };
      default:
        return state;
    }
  },
  initialState: { counter: 1 },
});
```

## `createEngine` options

```
{
  mapper,
  transformer,
  consumer,
  reducer,
  initialState,
  getApiProps,
  getDependencies,
}
```

### `transformer`

A function taking an event and returning an iterable collection of messages.

```
{
  *transformer(
    event,
    {
      getApiProps,
      getState,
    }
  ) {
    yield message;
  }
}
```

### `consumer`

A function taking an event and producing side effects.

Note: the `dispatch` option must not be called synchronously.

```
{
  consumer(
    event,
    {
      dispatch,
      getApiProps,
      getDependencies,
      getState,
    }
  ) {
    sideEffect();
  }
}
```

### `reducer`

A pure function taking the current state and an event, and returning the new state.

```
{
  reducer(
    state,
    event,
    {
      getApiProps,
    }
  ) {
    return state;
  }
}
```

### `initialState`

The initial value of the state.

### `getApiProps`

A function provided as an option to the `transformer`, to the `consumer` and to the `reducer`.

### `getDependencies`

A function provided as an option to the `consumer`.

## Engine API

```
{
  dispatch,
  getState,
  subscribe,
}
```
