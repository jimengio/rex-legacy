## Rex(Legacy)

> [Rex](https://github.com/jimengio/rex) compatible library for migration old project.

Store abstraction based on immer and **OLD** Context APIs.

### Usage

![](https://img.shields.io/npm/v/@jimengio/rex-legacy.svg)

```bash
npm install @jimengio/rex-legacy
```

Model:

```ts
export interface IGlobalStore {
  schemaVersion: string;
  data: number;
  branchData: number;
  homeData: number;
}

export let initialStore: IGlobalStore = {
  schemaVersion: "0.1",
  data: 2,
  branchData: 2,
  homeData: 2,
};
```

```ts
import { createStore } from "rex";

export let globalStore = createStore<IGlobalStore>(initialStore);
```

View:

```tsx
import { RexProvider } from "rex";

const renderApp = () => {
  ReactDOM.render(
    <RexProvider value={globalStore}>
      <Container store={globalStore.getState()} />
    </RexProvider>,
    document.querySelector(".app")
  );
};

window.onload = () => {
  renderApp();
  globalStore.subscribe(renderApp);
};
```

Controller:

```ts
export function doIncData() {
  globalStore.update((store) => {
    store.data += 1;
  });
}
```

Selector:

```tsx
import { connectRex } from "rex";

@connectRex((store: IGlobalStore, ownProps: IProps) => ({ data: store.data }))
export default class Inside extends React.PureComponent<IProps, IState> {
  render() {
    return <div />;
  }
}
```

### Workflow

https://github.com/jimengio/ts-workflow

### License

MIT
