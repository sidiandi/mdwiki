# MDWiki (Markdown Wiki)

[![Build Status](https://travis-ci.org/mdwiki/mdwiki.png?branch=develop)](https://travis-ci.org/mdwiki/mdwiki)
[![Dependency status](https://david-dm.org/mdwiki/mdwiki.png)](https://david-dm.org/mdwiki/mdwiki)

This repository contains a **Node.js** project for a simple **Markdown** based wiki. MDWiki is open source and can used in two ways.

The first way is to use our hosted version on www.mdwiki.net.

To use this hosted version you just have to create of public repository on [Github](html://github.com) for the content of your wiki.
The only required file is the **index.md**. In this file you can create links to navigate to the other files of your wiki.

When you have created your content repository on **github**, you just have to navigate to the www.mdwiki.net
and enter your user name and the name of your repository. MDWiki will now read the content of your repository.
This informations will be saved in the local storage of your webbrowser, so when you come back to MDWiki you'll see automatically your own wiki content.

The second way to use MDWiki is to create a fork of the source code from github.com/mdwiki/mdwiki and deploy it to your own node hoster. 
For **www.mdwiki.net** we are using **Heroku**, but other node hosters like **Windows Azure** or **Open Shift** can also be used.

MDWiki has currently two providers for the content. The first provider is the **Github** provider. The second provider is the **Git** provider.
With this provider it's possible to save the content directly in your own webspace. To use this provider you have to deploy the source code to a provider 
that allows you to use **git** and **grep** in the console.

The current version provides just read only access to the content of your wiki. To change the content you just have to clone the repository locally, 
edit your pages in your favored markdown editor and push the changes to github. MDWiki will show you automatically the latest version of your pages.

For more informations about the project see the [wiki](https://github.com/janbaer/mdwiki/wiki) page of this repository. 
We will write more technical informations about the project there.
