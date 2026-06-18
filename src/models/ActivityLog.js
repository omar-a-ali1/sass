const mongoose = require('mongoose')

const schema = mongoose.Schema({
  actor:    { type: String, default: null, index: true },
  action:   { type: String, required: true, index: true },
  resource: { type: String, required: true, index: true },
  resourceId: { type: String, default: null },
  metadata: Object,
  ip:       { type: String, default: null },
  userAgent: { type: String, default: null },
  traceId:  { type: String, default: null },
}, { timestamps: true })

schema.index({ createdAt: -1 })
schema.index({ actor: 1, createdAt: -1 })

module.exports = mongoose.model('ActivityLog', schema)
