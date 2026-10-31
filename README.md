# svgist.cdcl.ml

Render GitHub gists as self-contained SVG: [pin gists](https://docs.github.com/en/account-and-profile/how-tos/profile-customization/pinning-items-to-your-profile) anywhere (embed in READMEs & websites)!

```
https://svgist.cdcl.ml/GIST_ID[/FILENAME][?grid=1&theme=auto]
```

- `grid` is `0` (default)/`1` to force wide unicode chars into monospace
- `theme` is `auto` (default)/`dark`/`light`

For example, [casperdcl/shtory](https://github.com/casperdcl/shtory) uses:

```markdown
![example](https://svgist.cdcl.ml/0bfb38f71908213bd251765c066343a2?grid=1)
```

![example](https://svgist.cdcl.ml/0bfb38f71908213bd251765c066343a2?grid=1)
