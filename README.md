<h1 align="center">React Native Quick WebSQL</h1>

![cover](https://repository-images.githubusercontent.com/486860084/27ea3b8e-30c4-4acb-9c2c-691b37d9e2a2)

This library provides a [WebSQL](http://www.w3.org/TR/webdatabase/)-compatible API to store data in a react native app, by using a fast [JSI](https://formidable.com/blog/2019/jsi-jsc-part-2/) implementation of the SQLite driver [react-native-quick-sqlite](https://github.com/ospfranco/react-native-quick-sqlite).

## Installation

```sh
yarn add react-native-quick-websql react-native-quick-sqlite
npx pod-install
```

## Usage

See [an example project](./example/src/App.tsx) for more detail.

```js
import WebSQLite from "react-native-quick-websql";

const db = WebSQLite.openDatabase('mydb.db')
db.transaction(
  (txn) => {
    console.log('Running transaction')
    txn.executeSql('DROP TABLE IF EXISTS Users', [])
    txn.executeSql(
      'CREATE TABLE IF NOT EXISTS Users(user_id INTEGER PRIMARY KEY NOT NULL, name VARCHAR(30))',
      []
    )
    txn.executeSql('INSERT INTO Users (name) VALUES (:name)', [
      'nora',
    ])
    txn.executeSql('INSERT INTO Users (name) VALUES (:name)', ['takuya'])
    txn.executeSql('SELECT * FROM `users`', [], function (_tx, res) {
      for (let i = 0; i < (res.rows?.length || 0); ++i) {
        console.log('item:', res.rows?.item(i))
      }
    })
  },
  (e) => {
    console.error(e)
  }
)
```


## Limitations & Debugging

As the library uses JSI for synchronous native methods access, remote debugging (e.g. with Chrome) is no longer possible.
Instead, you should use [Flipper](https://github.com/facebook/flipper).

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT by Takuya Matsuyama
