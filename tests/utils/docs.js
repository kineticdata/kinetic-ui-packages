import fs from 'fs';

export const fetchDocMarkdown = (filename = '/README.md') => {
  const promise = new Promise((resolve, reject) => {
    fs.readFile(`${__dirname}/../../docs/${filename}`, (error, data) => {
      if (error) {
        reject(error);
      }

      resolve(data.toString().split('\n'));
    });
  });

  return promise;
};
