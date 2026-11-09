export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // 标题上限放宽到 100：中文标题信息密度高，默认的 72 字符经常写不完。
    'header-max-length': [2, 'always', 100],
    // 正文不按列宽强制折行：中文正文一行信息量大，硬折行只会制造噪音，
    // 真正需要折行的场景交给编辑器处理。
    'body-max-line-length': [0],
    // 中文主题没有大小写概念，这条规则只会误报。
    'subject-case': [0],
  },
  ignores: [
    // 以下提交不是人写的，改不了也不该改；放行避免历史里一旦存在就永远 push 不上去。
    (message) => /^Merge (pull request|branch|remote-tracking)/.test(message),
    (message) => /^chore\(release\): /.test(message),
    (message) => /^Revert "/.test(message),
  ],
};
