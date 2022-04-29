// @ts-ignore
import customOpenDatabase from 'websql/custom'
import SQLiteDatabase from './sqlite-database'
import type {WebsqlDatabase, WebsqlDatabaseCallback} from './websql-database'

const openDB = customOpenDatabase(SQLiteDatabase)

class SQLitePlugin {
  openDatabase(
    args: {
      name: string
      version: string
      description: string
      size: number
    },
    callback: WebsqlDatabaseCallback
  ): WebsqlDatabase
  openDatabase(
    name: string,
    version?: string,
    description?: string,
    size?: number,
    callback?: WebsqlDatabaseCallback
  ): WebsqlDatabase

  openDatabase(
    name:
      | string
      | {
          name: string
          version: string
          description: string
          size: number
        },
    version?: string | WebsqlDatabaseCallback,
    description?: string,
    size?: number,
    callback?: WebsqlDatabaseCallback
  ): WebsqlDatabase {
    if (name && typeof name === 'object') {
      // accept SQLite Plugin 1-style object here
      callback = typeof version === 'function' ? version : undefined
      size = name.size
      description = name.description
      version = name.version
      name = name.name
    }
    if (!size) {
      size = 1
    }
    if (!description) {
      description = name
    }
    if (!version) {
      version = '1.0'
    }
    if (typeof name === 'undefined') {
      throw new Error('please be sure to call: openDatabase("myname.db")')
    }
    return openDB(name, version, description, size, callback)
  }
}

export default new SQLitePlugin()
export * from './websql-database'
