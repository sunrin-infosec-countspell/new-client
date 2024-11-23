interface Virus {
    "system-overload" : boolean,
    "network-overload" : boolean,
    "user-modification" : boolean,
    "event-log-modification" : boolean,
    "virus-activation" : boolean,
    "admin-privilege-escalation" : boolean,
    "file-modification" : boolean
}

export class Awnser {

    virus: Virus = {
        "system-overload": false,
        "network-overload": false,
        "user-modification": false,
        "event-log-modification": false,
        "virus-activation": false,
        "admin-privilege-escalation": false,
        "file-modification": false
    }

}