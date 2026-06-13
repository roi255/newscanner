# Makefile - pull a git bundle from the sandbox into this repo and push to remote.
# Drop newscanner.bundle in this folder, then run `make update` (or `make first`).

BUNDLE  := newscanner.bundle
TMP     := incoming
REMOTE  := origin
BRANCH  := main

.PHONY: verify update first sync clean help apk

help:
	@echo "make verify  - check the bundle is intact"
	@echo "make update  - fetch bundle, fast-forward push to $(REMOTE)/$(BRANCH), sync, cleanup"
	@echo "make first   - same but force-push (one-time, for unrelated histories)"
	@echo "make clean   - remove the bundle and temp branch"

verify:
	git bundle verify $(BUNDLE)

# Normal flow: histories share a base, so this is a fast-forward.
update: verify
	git fetch $(BUNDLE) master:$(TMP)
	git push $(REMOTE) $(TMP):$(BRANCH)
	$(MAKE) sync
	$(MAKE) clean

# One-time flow: remote has an unrelated history that must be overwritten.
first: verify
	git fetch $(BUNDLE) master:$(TMP)
	git push --force $(REMOTE) $(TMP):$(BRANCH)
	$(MAKE) sync
	$(MAKE) clean

# Point your working copy at the new main.
sync:
	git checkout -B $(BRANCH) $(REMOTE)/$(BRANCH)

clean:
	-git branch -D $(TMP)
	-rm -f $(BUNDLE)
	@echo "Cleaned up $(BUNDLE) and branch $(TMP)."

apk:
	npx expo prebuild --platform android
	cd android && ./gradlew assembleRelease
