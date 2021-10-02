# missiondb

## Briefly
Database for medical mission work. Intentionally simple. Multiuser but phone/laptop based and robust in disconnected environments.

## Inspiration
Dr. Gennadiy Fuzaylov, a pediatric anesthesiologist at Massachusetts General Hospital and veteran of over 60 medical missions to the Ukraine, Columbia and found keeping track of patients, procedures and results was increasingly difficult. 
![Doctors Collaborating To Help Children](images/dctohc.png)(https://www.dctohc.org)
A spreadsheet was not adequate -- poor phone interface, poor support for images, poorly multiuser and problematic security. Hence this project was born.

## Scope
### In scope
- Patient name, problem, image and demographics
- Medical procedures with description, data, images, taylored checklists
- Providers with contact information
- Followup
- Workflow support including patient ID cards, handheld data entry
- Schedule
### Out of scope
- lab values 
- vital signs
- drug and supply information
- Free text fields available for extra information

## Design
* Written by Paul Alfille MD, at Massachusetts General Hospital in 2021
* [Pouchdb](https://pouchdb.com/) is front end for device interaction (Javascript on browsers)
* [Couchdb](https://couchdb.apache.org/) backend for document dabase
  * Tolerant of poorly connected operation
  * Document based with tag fields
  * Excellent replication support to allow redundancy and remote access
* Consider IBMs [Cloudant](https://www.ibm.com/cloud/cloudant) for cloud storage with a free account for small projects
* All components are open source, as is this project

## Schema
* Mission
  * Location/Name
  * Year
  * Start date
  * End date
* Provider
  * Name
  * Contact info
  * Picture
* Trip
  * Link to Mission
  * Link to Provider
  * Comments / Images
  * Travel data
* Schedule
  * Link to Mission
  * Date
  * OR
  * Time
  * Link to patient
  * Link to provider(s)
* Patient
  * Name
  * Contact info
  * Link to Mission(s)
  * Operation
  * Operative Data
  * Preop data
  * postop data
  * pictures
  
So there is a light relational database on top of the data

# Installation
* Instructions from [pouchdb](https://pouchdb.com/guides/setup-couchdb.html):
```
#install couchdb
sudo apt install couchdb

#start couchdb
sudo systemctl start couchdb

#test
curl localhost:598

# add [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
sudo npm install -g add-cors-to-couchdb
add-cors-to-couchdb

# PouchDB
sudo npm install --save pouchdb-browser

# react,js
Instructions from https://medium.com/@kayodeniyi/simplest-react-app-setup-a74277b99e43


```

  

