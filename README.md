![NebulaE](docs/images/nebula.png "Nebula Engineering SAS")

# Table of contents
1. [Introduction](#introduction)
2. [Project Structure](#structure)
3. [License](#license)

# Introduction <a name="introduction"></a>
Some introduction text, formatted in heading 2 style

# Project structure <a name="structure"></a>

├── README.md                           => this doc
├── api                                 => Micro-APIs
│   └── gateway                         => Micro-API for [GateWay API](https://github.com/nebulae-tpm/gateway)
├── backend                             => Micro-BackEnds
│   ├── devices-report-receptionist     => Micro-BackEnd responsible for publishing IoT devices reports
│   └── devices-report-handler          => Micro-BackEnd responsible for Handling IoT devices reports published by devices-report-receptionist
├── deployment                          => Automatic deployment strategies
│   ├── compose                         => Docker-Compose environment for local development
│   └── gke                             => Google Kubernetes Engine deployment file descriptors
├── docs                                => Documentation resources
│   └── images
└── etc                                 => Micro-Service config Files.
    └── mapi-setup.json                 => Micro-API setup file


# License <a name="license"></a>

Copyright 2018 Nebula Engineering SAS

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.