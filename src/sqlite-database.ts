import 'react-native-quick-sqlite'
import type {SQLResultSet, SQLResultSetRowList} from './websql-database'

function massageError(err: string | Error) {
  return typeof err === 'string' ? new Error(err) : err
}

interface NodeCallback<T> {
  (err: Error, result?: undefined): void
  (err: undefined | null, result: T): void
}

interface SQLQuery {
  sql: string
  args: any[]
}

function escapeBlob(data: any) {
  if (typeof data === 'string') {
    return data
      .replace(/\u0002/g, '\u0002\u0002')
      .replace(/\u0001/g, '\u0001\u0002')
      .replace(/\u0000/g, '\u0001\u0001')
  } else {
    return data
  }
}

function unescapeBlob(data: any) {
  if (typeof data === 'string') {
    return data
      .replace(/\u0001\u0001/g, '\u0000')
      .replace(/\u0001\u0002/g, '\u0001')
      .replace(/\u0002\u0002/g, '\u0002')
  } else {
    return data
  }
}

class SQLiteDatabase {
  _name: string

  constructor(name: string) {
    this._name = name
    sqlite.open(name)
  }

  exec(
    queries: SQLQuery[],
    _readOnly: boolean,
    callback: NodeCallback<SQLResultSet[]>
  ) {
    try {
      const results: SQLResultSet[] = []
      for (const {sql, args} of queries) {
        const escapedArgs = args.map(escapeBlob)
        const response = sqlite.executeSql(this._name, sql, escapedArgs)
        const rows: SQLResultSetRowList = Object.assign(
          [...(response.rows?._array || [])].map((row) =>
            Object.keys(row).reduce(function (result: any, key: any) {
              result[key] = unescapeBlob(row[key])
              return result
            }, {})
          ),
          {
            item(this: SQLResultSetRowList, idx: number) {
              this[idx]
            },
          }
        )

        const resultSet: SQLResultSet = {
          insertId: response.insertId || 0,
          rowsAffected: response.rowsAffected,
          rows: rows,
        }
        results.push(resultSet)
      }
      callback(undefined, results)
    } catch (e) {
      callback(massageError(e as Error))
    }
  }
}

export default SQLiteDatabase
