import { defineConfig } from '@surmon-china/libundler'

export default defineConfig({
  libName: 'NaiveBayes',
  entry: 'src/naivebayes.js',
  outDir: 'dist',
  outFileName: 'naivebayes',
  targets: ['esm', 'umd'],
  sourcemap: false,
})
