function getIp(req) {
  return (req.ip || '').replace('::ffff:', '') || '0.0.0.0';
}
module.exports = { getIp };