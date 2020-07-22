import mergeStream from 'merge-stream'
import helper from '../helpers/bower'
import themes from '../helpers/get-themes'

export const bower = () => {
  const streams = mergeStream()
  themes().forEach(name => {
    streams.add(helper(name))
  })
  return streams
}
