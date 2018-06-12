![NebulaE](docs/images/nebula.png "Nebula Engineering SAS")

# Devices Report MicroService
The general porpouse of this service is to listen, format and publish data coming from Embedded Devices.  
This process is handle by two subprocess:
 * recepcionist: listen to incoming reports from every embedded devices throught the IoT MQTT Topic, then decompress the data and made them available to every service by publishing 'DeviceGeneralInformationReported' events to the event store.  
 * handler: listen to 'DeviceGeneralInformationReported' events on the event store, formats and normalizes the data, then creates and mantains a persistent profile of each device so it can infer status differences and publish deltas.

![Intro](docs/images/ms-devices-report_intro.png "Intro")

# Table of Contents
  * [Project Structure](#structure)
  * [FrontEnd](#frontend) - not yet available  
    *  [Environment variables](#frontend_env_vars) - not yet available  
  * [API](#api)
    * [GraphQL throught Gateway API](#api_gateway_graphql)
  * [BackEnd](#backend)
    *  [Recepcionist](#backend_recepcionist)
        *  [Environment variables](#backend_recepcionist_env_vars)
        *  [CronJobs](#backend_recepcionist_cronjobs)
        *  [Event Sourcing](#backend_recepcionist_eventsourcing)
    *  [Handler](#backend_handler)
        *  [Environment variables](#backend_handlert_env_vars)
        *  [CronJobs](#backend_handler_cronjobs)
        *  [Event Sourcing](#backend_handler_eventsourcing)
  * [Prepare development environment](#prepare_dev_env)
  * [License](#license)


# Project structure <a name="structure"></a>

```
.
├── frontend                            => Micro-FrontEnds - not yet available  
│   └── emi                             => Micro-FrontEnd for [EMI FrontEnd](https://github.com/nebulae-tpm/emi) - not yet available  
├── api                                 => Micro-APIs  
│   └── gateway                         => Micro-API for [Gateway API](https://github.com/nebulae-tpm/gateway)  
├── backend                             => Micro-BackEnds  
│   ├── devices-report-receptionist     => Micro-BackEnd responsible for publishing IoT devices reports  
│   └── devices-report-handler          => Micro-BackEnd responsible for Handling IoT devices reports published by devices-report-receptionist  
├── etc                                 => Micro-Service config Files.  
├── deployment                          => Automatic deployment strategies  
│   ├── compose                         => Docker-Compose environment for local development  
│   └── gke                             => Google Kubernetes Engine deployment file descriptors  
│   └── mapi-setup.json                 => Micro-API setup file  
├── .circleci                           => CircleCI v2. config directory
│   ├── config.yml
│   └── scripts
├── docs                                => Documentation resources  
│   └── images  
├── README.md                           => This doc
```

# API <a name="api"></a>
Exposed interfaces to send Commands and Queries by the CQRS principles.  
The MicroService exposes its interfaces as Micro-APIs that are nested on the general API.  

## GraphQL throught Gateway API <a name="api_gateway_graphql"></a>
These are the exposed GraphQL functions throught the [Gateway API](https://github.com/nebulae-tpm/gateway).  

Note: You may find the GraphQL schema [here](api/gateway/graphql/device-report-handler/schema.gql)

### getDeviceAlarmThresholds
Gets the runtime threshold values used to generate CPU, RAM, Volumes and temperature alarms.  

# BackEnd <a name="backend"></a>
Backends are defined processes within a docker container.  
Each process is responsible to build, run and maintain itself.  

## Recepcionist <a name="backend_recepcionist"></a>
L

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