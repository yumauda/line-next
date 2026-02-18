import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

async function generateStylesScss() {
  const baseDir = 'src/sass';
  const outputFile = path.join(baseDir, 'styles.scss');

  // 各ディレクトリからSCSSファイルを取得
  const categories = ['base', 'layout', 'project', 'component'];
  let content = '';

  for (const category of categories) {
    const files = await glob(`${baseDir}/${category}/*.scss`, {
      ignore: [`${baseDir}/${category}/_index.scss`]
    });

    if (files.length > 0) {
      content += `// ${category.charAt(0).toUpperCase() + category.slice(1)}\n`;

      // ファイル名でソート
      files.sort();

      for (const file of files) {
        const relativePath = `./${category}/${path.basename(file, '.scss')}`;
        content += `@use "${relativePath}";\n`;
      }
      content += '\n';
    }
  }

  // ファイルに書き込み
  await fs.writeFile(outputFile, content.trim() + '\n', 'utf-8');
  console.log('✓ styles.scss generated successfully!');
}

generateStylesScss().catch(error => {
  console.error('Error generating styles.scss:', error);
  process.exit(1);
});
