import * as React from "react";
import produce from "immer";
import * as shallowequal from "shallowequal";
import * as PropTypes from "prop-types";

function devPoint(...args) {
  // console.log(...args)
}

interface IRexProviderProps {
  value: any;
}

export class RexProvider extends React.Component<IRexProviderProps, any> {
  getChildContext() {
    return this.props.value;
  }
  render() {
    return this.props.children;
  }
}

let storeContextTypes = {
  getState: PropTypes.func.isRequired,
  subscribe: PropTypes.func.isRequired,
  unsubscribe: PropTypes.func.isRequired,
  update: PropTypes.func.isRequired,
};

(RexProvider as any).childContextTypes = storeContextTypes;

interface IRexStore<T> {
  getState: () => T;
  subscribe: (f: (store: T) => void) => void;
  unsubscribe: (f: (store: T) => void) => void;
  update: (f: (store: T) => void) => void;
}

export function createStore<T>(initalState: T) {
  let store = {
    currentState: initalState,
    listeners: [],
  };

  return {
    getState: () => store.currentState,
    subscribe: (f) => {
      store = produce(store, (draft) => {
        // bypass warning of "setState on unmounted component" with unshift
        draft.listeners.unshift(f);
      });
    },
    unsubscribe: (f) => {
      store = produce(store, (draft) => {
        draft.listeners = draft.listeners.filter((x) => x != f);
      });
    },
    update: (f) => {
      let newStore = produce(store.currentState as any, f);
      store = produce(store, (draft) => {
        draft.currentState = newStore;
      });
      store.listeners.forEach((cb) => {
        cb(store.currentState);
      });
    },
  } as IRexStore<T>;
}

interface IRexDataLayerProps {
  store: IRexStore<any>;
  parentProps: any;
  Child: any;
  selector: (s: any, ownProps: any) => any;
}
interface IRexDataLayerState {
  props: any;
}

class RexDataLayer extends React.Component<IRexDataLayerProps, IRexDataLayerState> {
  constructor(props) {
    super(props);

    this.state = {
      props: this.computeProps(),
    };
  }

  computeProps() {
    return produce(this.props.selector(this.props.store.getState(), this.props.parentProps), (x) => {});
  }

  immerState(f: (s: any) => void, cb?) {
    this.setState(produce<IRexDataLayerState>(f), cb);
  }

  render() {
    devPoint("render Rex wrapper");
    let Child = this.props.Child;
    return <Child {...this.state.props} {...this.props.parentProps} />;
  }

  shouldComponentUpdate(nextProps: IRexDataLayerProps, nextState: IRexDataLayerState) {
    if (!shallowequal(nextProps.parentProps, this.props.parentProps)) {
      return true;
    }
    if (!shallowequal(nextState.props, this.state.props)) {
      return true;
    }
    return false;
  }

  componentDidMount() {
    this.props.store.subscribe(this.onStoreChange);
  }

  componentWillUnmount() {
    this.props.store.unsubscribe(this.onStoreChange);
  }

  onStoreChange = (newStore) => {
    this.immerState((state) => {
      state.props = this.computeProps();
    });
  };
}

export function connectRex<T>(selector: (s: T, ownProps?: any) => any): any {
  return (Target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    let RexContainer = class RexContainer extends React.Component {
      render() {
        devPoint("render interal");
        let store = this.context as IRexStore<T>;
        devPoint("consumer called");

        return <RexDataLayer store={store} parentProps={this.props} Child={Target} selector={selector} />;
      }
    };
    (RexContainer as any).contextTypes = storeContextTypes;
    return RexContainer;
  };
}
