'use strict'

var ExpressAdapter = require('./lib/adapters/express')
var HapiAdapter = require('./lib/adapters/hapi')
var HttpAdapter = require('./lib/adapters/http')
var KoaAdapter = require('./lib/adapters/koa')
var LogAdapter = require('./lib/adapters/log')
var MapRoutes = require('./lib/map-routes')
var _ = require('lodash')

var opts = {
  spec: null,
  server: {
    name: 'hapi',
    context: null,
    adapter: null
  },
  adapters: {
    hapi: HapiAdapter,
    express: ExpressAdapter,
    koa: KoaAdapter,
    http: HttpAdapter,
    log: LogAdapter
  }
}

module.exports = function web (options) {
  var seneca = this
  var extend = seneca.util.deepextend

  opts = extend(opts, options)

  seneca.add('role:web,spec:*', specRoutes)
  seneca.add('role:web,set:server', setServer)
  seneca.add('init:web', init)

  return {
    name: 'web',
    exportspec: {
      setServer: setServer.bind(seneca),
      specRoutes: specRoutes.bind(seneca)
    }
  }
}

function specRoutes (msg, done) {
  var seneca = this
  var context = opts.server.context
  var adapter = opts.server.adapter
  var routes = MapRoutes(msg.spec)

  adapter.call(seneca, context, routes, done)
}

function setServer (msg, done) {
  var seneca = this
  var name = msg.name || ''
  var adapter = msg.adapter || _.get(opts.adapters, name)
  var context = msg.context
  var spec = msg.spec

  seneca.log.debug('setting server')
  opts.server = {
    name: name,
    context: context,
    adapter: adapter
  }

  if (spec) {
    specRoutes.call(seneca, {spec: spec}, done)
    return
  }

  done()
}

function init (msg, done) {
  var config = {
    name: opts.server.name,
    context: opts.server.context,
    adapter: opts.server.adapter,
    spec: opts.spec
  }

  setServer.call(this, config, done)
}
