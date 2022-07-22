import { QuickSQLite } from 'react-native-quick-sqlite'
import type { SQLResultSet, SQLResultSetRowList } from './websql-database'

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

class SQLiteDatabase {
  _name: string

  constructor(name: string) {
    this._name = name
    QuickSQLite.open(name)
  }

  exec(
    queries: SQLQuery[],
    _readOnly: boolean,
    callback: NodeCallback<SQLResultSet[]>
  ) {
    try {
      const results: SQLResultSet[] = []
      for (const { sql, args } of queries) {
        const response = QuickSQLite.executeSql(this._name, sql, args)
        const rows: SQLResultSetRowList = Object.assign(
          [...(response.rows?._array || [])],
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
