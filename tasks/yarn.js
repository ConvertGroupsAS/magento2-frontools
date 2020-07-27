import mergeStream from 'merge-stream'
import helper from '../helpers/yarn'
import themes from '../helpers/get-themes'

export const yarn = () => {
  const streams = mergeStream()
  themes().forEach(name => {
    streams.add(helper(name))
  })
  return streams
}
