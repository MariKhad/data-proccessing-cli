# Data Processing CLI

## Description

Interactive command-line tool for file system navigation and data processing using Node.js Streams API and Worker Threads.

## Getting Started

```bash
git clone https://github.com/YOUR_USERNAME/data-processing-cli.git
cd data-processing-cli
npm install
npm run start
```

## Requirements

- Node.js >= 24.10.0
- npm >= 10.9.2
- No external dependencies

## Commands

### Navigation

- `up` - Move up one directory
- `cd <path>` - Change directory
- `ls` - List files/folders

### CSV/JSON

- `csv-to-json --input file.csv --output file.json`
- `json-to-csv --input file.json --output file.csv`

### File Analysis

- `count --input file.txt`
- `hash --input file.txt` (default sha256)
- `hash --input file.txt --algorithm md5`
- `hash --input file.txt --algorithm sha512`
- `hash --input file.txt --save`

### Hash Compare

- `hash-compare --input file.txt --hash file.txt.sha256`
- `hash-compare --input file.txt --hash file.txt.md5 --algorithm md5`

### Encryption

- `encrypt --input file.txt --output file.enc --password pass`
- `decrypt --input file.enc --output file.txt --password pass`

### Log Analysis

- `log-stats --input logs.txt --output stats.json`

### Exit

- `.exit` or `Ctrl+C`

## Output Examples

**count**
