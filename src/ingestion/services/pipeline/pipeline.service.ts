import {Result} from './../../interfaces/Ingestion-data';
import {HttpCustomService} from './../HttpCustomService';
import {Injectable} from '@nestjs/common';
import {IngestionDatasetQuery} from '../../query/ingestionQuery';
import {DatabaseService} from '../../../database/database.service';
import {GenericFunction} from '../generic-function';
import {Pipeline} from '../../interfaces/Ingestion-data'

@Injectable()
export class PipelineService {
    constructor(private DatabaseService: DatabaseService, private service: GenericFunction, private http: HttpCustomService,) {
    }

    async pipeline(pipelineData: Pipeline): Promise<Result> {
        try {
            let pipeSchema = {
                "input": {
                    "type": "object",
                    "properties": {
                        "pipeline_name": {
                            "type": "string",
                            "shouldnotnull": true
                        },

                    },
                    "required": [
                        "pipeline_name"
                    ]
                }
            };
            const pipelineName = pipelineData.pipeline_name;
            if (pipelineName == "") {
                return {code: 400, error: "Pipeline name cannot be empty"}
            }
            const isValidSchema: any = await this.service.ajvValidator(pipeSchema.input, pipelineData);
            if (isValidSchema.errors) {
                return {code: 400, error: isValidSchema.errors}
            }
            else {
                const queryStr = await IngestionDatasetQuery.getPipelineSpec(pipelineName);
                const queryResult = await this.DatabaseService.executeQuery(queryStr.query, queryStr.values);
                if (queryResult.length === 1) {
                    const transformer_file = queryResult[0].transformer_file;
                    let nifi_root_pg_id, pg_list, pg_source;
                    const processor_group_name = pipelineData.pipeline_name;
                    let data = {};
                    const config = {
                        headers: {"Content-Type": "application/json"}
                    };

                    let res = await this.http.get(`${process.env.URL}/nifi-api/process-groups/root`);
                    nifi_root_pg_id = res.data['component']['id'];
                    let resp = await this.http.get(`${process.env.URL}/nifi-api/flow/process-groups/${nifi_root_pg_id}`);
                    pg_list = resp.data;
                    let counter = 0;
                    let pg_group = pg_list['processGroupFlow']['flow']['processGroups'];
                    for (let pg of pg_group) {
                        if (pg.component.name == processor_group_name) {
                            pg_source = pg;
                            counter = counter + 1;
                            data = {
                                "id": pg_source['component']['id'],
                                "state": "STOPPED",  // RUNNING or STOP
                                "disconnectedNodeAcknowledged": false
                            };
                            await this.http.put(`${process.env.URL}/nifi-api/flow/process-groups/${pg_source['component']['id']}`, data,);
                            break;
                        }
                    }
                    if (counter == 0) {
                        let response = await this.addProcessorGroup(processor_group_name);
                        pg_source = response['data'];
                        await this.addProcessor('org.apache.nifi.processors.standard.GenerateFlowFile', 'generateFlowFile', pg_source['component']['id']);
                        await this.addProcessor('org.apache.nifi.processors.standard.ExecuteStreamCommand', 'pythonCode', pg_source['component']['id']);
                        await this.addProcessor('org.apache.nifi.processors.standard.LogMessage', 'successLogMessage', pg_source['component']['id']);
                        await this.addProcessor('org.apache.nifi.processors.standard.LogMessage', 'failedLogMessage', pg_source['component']['id']);
                        const generateFlowFileID = await this.getProcessorSourceId(pg_source['component']['id'], 'generateFlowFile');
                        const pythonCodeID = await this.getProcessorSourceId(pg_source['component']['id'], 'pythonCode');
                        const successLogMessageID = await this.getProcessorSourceId(pg_source['component']['id'], 'successLogMessage');
                        const failedLogMessageID = await this.getProcessorSourceId(pg_source['component']['id'], 'failedLogMessage');
                        const success_relationship = ["success"];
                        const python_failure_relationship = ["nonzero status"];
                        const python_success_relationship = ["output stream"];
                        const autoterminate_relationship = ["success"];
                        await this.connect(generateFlowFileID, pythonCodeID, success_relationship, pg_source['component']['id']);
                        await this.connect(pythonCodeID, successLogMessageID, python_success_relationship, pg_source['component']['id']);
                        await this.connect(pythonCodeID, failedLogMessageID, python_failure_relationship, pg_source['component']['id']);
                        await this.updateProcessorProperty(pg_source['component']['id'], 'pythonCode', transformer_file);
                        await this.updateProcessorProperty(pg_source['component']['id'], 'generateFlowFile', transformer_file);
                        await this.updateProcessorProperty(pg_source['component']['id'], 'successLogMessage', transformer_file);
                        await this.updateProcessorProperty(pg_source['component']['id'], 'failedLogMessage', transformer_file);
                        data = {
                            "id": pg_source['component']['id'],
                            "state": "RUNNING",  // RUNNING or STOP
                            "disconnectedNodeAcknowledged": false
                        };
                        await this.http.put(`${process.env.URL}/nifi-api/flow/process-groups/${pg_source['component']['id']}`, data)
                        return {
                            code: 200,
                            message: "Processor group running successfully"
                        }
                    }
                    else {

                        await this.processSleep(5000);
                        data = {
                            "id": pg_source['component']['id'],
                            "state": "RUNNING",  // RUNNING or STOP
                            "disconnectedNodeAcknowledged": false
                        };
                        await this.http.put(`${process.env.URL}/nifi-api/flow/process-groups/${pg_source['component']['id']}`, data);
                        return {
                            code: 200,
                            message: "Processor group running successfully"
                        }

                    }

                }
                else {
                    return {
                        code: 400,
                        error: "No pipeline found"
                    }
                }
            }
        }
        catch (e) {
            console.error('create-pipeline-impl.executeQueryAndReturnResults: ', e.message);
            throw new Error(e);
        }

    }

    async addProcessorGroup(processor_group_name: string) {
        let url = `${process.env.URL}/nifi-api/process-groups/root`;
        let result = await this.http.get(url);
        if (result) {
            const nifi_root_pg_id = result.data['component']['id'];
            const minRange = -500;
            const maxRange = 500;
            const x = Math.floor(Math.random() * (maxRange - minRange) + minRange);
            const y = Math.floor(Math.random() * (maxRange - minRange) + minRange);
            const pg_details = {
                "revision": {
                    "clientId": "",
                    "version": 0
                },
                "disconnectedNodeAcknowledged": "false",
                "component": {
                    "name": processor_group_name,
                    "position": {
                        "x": x,
                        "y": y
                    }
                }
            };
            try {
                let processurl = `${process.env.URL}/nifi-api/process-groups/${nifi_root_pg_id}/process-groups`;
                let processRes = await this.http.post(processurl, pg_details);
                if (processRes) {
                    return processRes
                }
                else {
                    return 'Failed to create the processor group';
                }
            } catch (error) {
                return {code: 400, error: "Error occured during processor group creation"}
            }

        }

    }

    async addProcessor(processor_name, name, pg_source_id) {
        let url = `${process.env.URL}/nifi-api/flow/process-groups/${pg_source_id}`;
        let result = await this.http.get(url);
        const pg_ports = result.data;
        const minRange = -250;
        const maxRange = 250;
        const x = Math.floor(Math.random() * (maxRange - minRange) + minRange);
        const y = Math.floor(Math.random() * (maxRange - minRange) + minRange);
        const processors = {
            "revision": {
                "clientId": "",
                "version": 0
            },
            "disconnectedNodeAcknowledged": "false",
            "component": {
                "type": processor_name,
                "bundle": {
                    "group": "org.apache.nifi",
                    "artifact": "nifi-standard-nar",
                    "version": "1.12.1"
                },
                "name": name,
                "position": {
                    "x": x,
                    "y": y
                }
            }
        };
        try {
            let addProcessUrl = `${process.env.URL}/nifi-api/process-groups/${pg_ports['processGroupFlow']['id']}/processors`;
            let addProcessResult = await this.http.post(addProcessUrl, processors);
            if (addProcessResult) {
                return "Successfully created the processor";
            }
            else {
                return "Failed to create the processor";
            }
        } catch (error) {
            return {code: 400, error: "Error occured during processor creation"}
        }


    }

    async getProcessorSourceId(pg_source_id, processor_name) {
        if (processor_name === 'generateFlowFile' || processor_name === 'pythonCode') {
            console.log("pgsource id is:", pg_source_id, processor_name)
        }
        const pg_ports = await this.getProcessorGroupPorts(pg_source_id);
        if (pg_ports) {
            let processors = pg_ports['processGroupFlow']['flow']['processors'];
            for (let pc of processors) {
                if (pc.component.name === processor_name) {
                    return pc.component.id;
                }
            }
        }
    }

    async getProcessorGroupPorts(pg_source_id) {
        let url = `${process.env.URL}/nifi-api/flow/process-groups/${pg_source_id}`;
        try {
            let res = await this.http.get(url);
            if (res.data) {
                return res.data;
            }
        } catch (error) {
            return {code: 400, error: "could not get Processor group port"}
        }


    }

    async connect(sourceId, destinationId, relationship, pg_source_id) {
        const pg_ports = await this.getProcessorGroupPorts(pg_source_id);
        if (pg_ports) {
            console.log('pipeline.service.pg_ports: ', pg_ports);
            const pg_id = pg_ports['processGroupFlow']['id'];
            const json_body = {
                "revision": {
                    "clientId": "",
                    "version": 0
                },
                "disconnectedNodeAcknowledged": "false",
                "component": {
                    "name": "",
                    "source": {
                        "id": sourceId,
                        "groupId": pg_id,
                        "type": "PROCESSOR"
                    },
                    "destination": {
                        "id": destinationId,
                        "groupId": pg_id,
                        "type": "PROCESSOR"
                    },
                    "selectedRelationships": relationship
                }
            };
            let url = `${process.env.URL}/nifi-api/process-groups/${pg_ports['processGroupFlow']['id']}/connections`;
            try {
                let result = await this.http.post(url, json_body);
                if (result) {
                    return `{message:Successfully connected the processor from ${sourceId} to ${destinationId}}`;
                }
                else {
                    return `{message:Failed connected the processor from ${sourceId} to ${destinationId}}`;
                }
            } catch (error) {
                return {code: 400, message: "Errror occured during connection"};
            }


        }
    }

    async updateProcessorProperty(pg_source_id, processor_name, transformer_file) {
        const pg_ports = await this.getProcessorGroupPorts(pg_source_id);
        if (pg_ports) {
            for (let processor of pg_ports['processGroupFlow']['flow']['processors']) {
                if (processor.component.name == processor_name) {
                    let update_processor_property_body;
                    if (processor_name == 'generateFlowFile') {
                        update_processor_property_body = {
                            "component": {
                                "id": processor.component.id,
                                "name": processor.component.name,
                                "config": {
                                    "autoTerminatedRelationships": [
                                        "original"
                                    ],
                                    "schedulingPeriod": "1 day"
                                }
                            },
                            "revision": {
                                "clientId": "",
                                "version": processor.revision.version
                            },
                            "disconnectedNodeAcknowledged": "False"
                        }
                    }
                    if (processor_name == 'failedLogMessage') {
                        update_processor_property_body = {
                            "component": {
                                "id": processor.component.id,
                                "name": processor.component.name,
                                "config": {
                                    "autoTerminatedRelationships": [
                                        "success"
                                    ],
                                    "properties": {
                                        "log-prefix": "error",
                                        "log-message": "error while executing the ${filename} python code"
                                    }
                                }
                            },
                            "revision": {
                                "clientId": "",
                                "version": processor.revision.version
                            },
                            "disconnectedNodeAcknowledged": "false"

                        }

                    }
                    if (processor_name == 'successLogMessage') {
                        update_processor_property_body = {
                            "component": {
                                "id": processor.component.id,
                                "name": processor.component.name,
                                "config": {
                                    "autoTerminatedRelationships": [
                                        "success"
                                    ],
                                    "properties": {
                                        "log-prefix": "info",
                                        "log-message": "succesfully executed the ${filename} python code"
                                    }
                                }
                            },
                            "revision": {
                                "clientId": "",
                                "version": processor.revision.version
                            },
                            "disconnectedNodeAcknowledged": "false"
                        }
                    }
                    if (processor_name == 'pythonCode') {
                        update_processor_property_body = {
                            "component": {
                                "id": processor.component.id,
                                "name": processor.component.name,
                                "config": {
                                    "autoTerminatedRelationships": [
                                        "original"
                                    ],
                                    "properties": {
                                        "Command Arguments": transformer_file, //python transformer code needed
                                        "Command Path": `${process.env.PYTHON_PATH}`,
                                        "Working Directory": `${process.env.WRK_DIR_PYTHON}`
                                    }
                                }
                            },
                            "revision": {
                                "clientId": "",
                                "version": processor.revision.version
                            },
                            "disconnectedNodeAcknowledged": "False"
                        }
                    }
                    let url = `${process.env.URL}/nifi-api/processors/${processor?.component?.id}`;
                    try {
                        let result = await this.http.put(url, update_processor_property_body);
                        if (result) {
                            return `{message:Successfully updated the properties in the ${processor_name}}`;

                        }
                        else {
                            return `{message:Failed to update the properties in the ${processor_name}}`;
                        }

                    } catch (error) {
                        return {code: 400, error: "Could not update the processor"};
                    }


                }
            }
        }
    }

    async processSleep(time) {
        return new Promise((resolve) => setTimeout(resolve, time));
    }
}
