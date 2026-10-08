# eMail Address Finder

Finds all email addresses in Body, From, To, & CC fields with smart deduplication and filtering.

It will then put them all into a single menu.

You can click on the menu & copy the address, or use batch copy actions:
- **Copy To**: Copies all primary recipients.
- **Copy Cc**: Copies carbon copy recipients.
- **Copy To + Cc**: Copies combined recipients.
- **Copy From**: Copies sender.
- **Copy From + Cc**: Copies sender and Cc recipients.
- **Copy All**: Copies all addresses found across headers and body.

For those wrangling email addresses all day, it's a massive time saver.

## Building & Installation

To package the extension for Thunderbird:
```bash
./build-release.sh