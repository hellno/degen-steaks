# degen steaks 🥩



### Git secret
There are a few files encrypted with [`git-secret`](https://github.com/sobolevn/git-secret) for sharing between developers. The files are encrypted and stored in the repo. 

To hide/update secrets in version control
1. `git secret add <filename>`
2. `git secret hide`

To show secrets (if you've been added to the keychain):
1. `git secret reveal`

To tell a new developer:
1. Get their gpg key and add it to your key chain.
2. Run `git secret tell <email@address.com>`
3. `git secret hide`
4. Commit the added address to version control
