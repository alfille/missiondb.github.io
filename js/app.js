var objectPatientData  ;
var objectNoteList ;

var LocalRec ;

var displayState ;
var userName ;
var patientId ;
var noteId ;
var operationId ;
var remoteCouch ;
var NoPhoto = "style/NoPhoto.png"
  
const cannonicalDBname = 'mdb' ;
var db = new PouchDB( cannonicalDBname ) ;

const cloudantDb = "https://apikey-v2-qx7a577tpow3c98mnl8lsy8ldwpzevtteatwbrl2611:d87aed426ff20ba3969ffa0a2b44c3d3@bc3debc5-694c-4094-84b9-440fc5bf6964-bluemix.cloudantnosqldb.appdomain.cloud" ;
var remoteCouch = cloudantDb ;

// used for record keys ( see makePatientId, etc )
const RecordFormat = {
    type: {
        patient: "p" ,
        operation: "o" ,
        note: "c" ,
        staff: "s" ,
        list: "l" ,
        } ,
    version: 0,
} ;

const structNewPatient = [
    {
        name: "LastName",
        hint: "Late name of patient",
        type: "text",
    },
    {
        name: "FirstName",
        hint: "First name of patient",
        type: "text",
    },
    {
        name: "DOB",
        hint: "Date of birst (as close as possible)",
        type: "date",
    },
] ;
    
const structDemographics = [
    {
        name: "LastName",
        hint: "Late name of patient",
        type: "text",
    },
    {
        name: "FirstName",
        hint: "First name of patient",
        type: "text",
    },
    {
        name: "DOB",
        hint: "Date of Birth",
        type: "date",
    },
    {
        name: "email",
        hint: "email address",
        type: "email",
    },
    {
        name: "phone",
        hint: "Contact phone number",
        type: "tel",
    },
    {
        name: "Address",
        hint: "Patient home address",
        type: "textarea",
    },
    {
        name: "Contact",
        hint: "Additional contact information (family member, local address,...)",
        type: "textarea",
    },
] ;

const structMedical = [
    {
        name: "Dx",
        hint: "Diagnosis",
        type: "textarea",
    } , 
    {
        name: "Complaint",
        hint: "Main complaint (patient's view of the problem)",
        type: "textarea",
    },
    {
        name: "Sex",
        hint: "Patient gender",
        type: "radio",
        choices: ["?","M","F","X"],
    },
    {
        name: "Weight",
        hint: "Patient weight (kg)",
        type: "number",
    },
    {
        name: "Height",
        hint: "Patient height (cm?)",
        type: "number",
    },
    {
        name: "ASA",
        hint: "ASA classification",
        type: "radio",
        choices: ["I","II","III","IV"],
    },
    {
        name: "Allergies",
        hint: "Allergies and intolerances",
        type: "textarea",
    },
    {
        name: "Meds",
        hint: "Medicine and antibiotics",
        type: "textarea",
    },
] ;

const structOperation = [
    {
        name: "Procedure",
        hint: "Surgical operation / procedure",
        type: "textarea",
    },
    {
        name: "Surgeon",
        hint: "Surgeon(s) involved",
        type: "text",
    },
    {
        name: "Equipment",
        hint: "Special equipment",
        type: "textarea",
    },
    {
        name: "Status",
        hint: "Status of operation planning",
        type: "radio",
        choices: ["none","unscheduled", "scheduled", "finished", "postponed", "cancelled"],
    },
    {
        name: "Date-Time",
        hint: "Scheduled date",
        type: "datetime",
    },
    {
        name: "Duration",
        hint: "Case length",
        type: "length",
    },
    {
        name: "Laterality",
        hint: "Is there a sidedness to the case?",
        type: "radio",
        choices: ["?", "L", "R", "L+R", "N/A"],
    },
] ;

const structSetting = [
    {
        name: "userName",
        alias: "User Name",
        hint: "Your user name",
        type: "text",
    },
    {
        name: "remoteCouch",
        alias: "Remote Database",
        hint: "user:password@url of remote -- don't include database name",
        type: "list",
        choices: [ cloudantDb, ],
    },
] ;

function createScheduleIndex() {
    let id = "_design/scheduling" ;
    let ddoc = {
        _id: id ,
        views: {
            bySurgeon: {
                map: function( doc ) {
                    if ( doc._id.split(';')[0] == RecordFormat.type.operation ) {
                        emit( doc.Surgeon, doc.Status ) ;
                    }
                }
            },
            scheduled: {
                map: function( doc ) {
                    if ( doc._id.split(';')[0] == RecordFormat.type.operation ) {
                        if ( doc.Status == "scheduled" ) {
                            emit( doc["Date-Time"], doc.Duration ) ;
                        }
                    }
                }
            },
            status: {
                map: function(doc) {
                    if ( doc._id.split(';')[0] == RecordFormat.type.operation ) {
                        emit( doc.status, null ) ;
                    }
                }
            },
        },
    } ;
    db.get( id )
    .catch( (e) => db.put( doc ) ) ;
}

class PatientData {
    constructor(...args) {
        this.parent = document.getElementById("PatientDataContent") ;
        let fieldset = document.getElementById("templates").querySelector("fieldset") ;
        
        this.doc = [] ;
        this.struct = [] ;
        this.ul = [] ;
        this.pairs = 0 ;

        for ( let iarg = 0 ; iarg<args.length ; ++iarg ) {
            this.doc[this.pairs] = args[iarg] ;
            ++ iarg ;
            if ( iarg == args.length ) {
                break ;
            }
            this.struct[this.pairs] = args[iarg] ;
            ++ this.pairs ;
        } 
        
        this.ButtonStatus( true ) ;
        [...document.getElementsByClassName("edit_note")].forEach( (e) => {
            e.disabled = false ;
        }) ;
        picker.detach() ;
        this.parent.innerHTML = "" ;
        
        for ( let ipair = 0 ; ipair < this.pairs ; ++ ipair ) {
            let fs = fieldset.cloneNode( true ) ;
            this.ul[ipair] = this.fill(ipair) ;
            fs.appendChild( this.ul[ipair] ) ;
            this.parent.appendChild( fs ) ;
        }
    }
    
    fill( ipair ) {
        var doc = this.doc[ipair] ;
        var struct = this.struct[ipair] ;

        var ul = document.createElement('ul') ;
        
        struct.forEach( ( item, idx ) => {
            var li = document.createElement("li");
            li.setAttribute("data-index",idx) ;
            var l = document.createElement("label");
            li.appendChild(l) ;
            
            if ( "alias" in item ) {
                l.appendChild( document.createTextNode(item.alias + ": ") );
            } else {
                l.appendChild( document.createTextNode(item.name + ": ") );
            }
            l.title = item.hint ;

            let i = null;
            switch( item.type ) {
                case "radio":
                    var v  = "" ;
                    var any_choices = item.choices.length > 0 ;
                    if ( item.name in doc ) { 
                        v = doc[item.name] ;
                        if ( !item.choices.includes(v) && any_choices ) {
                            v = item.choices[0] ;
                        }
                    } else if ( any_choices ) {
                        v = item.choices[0] ;
                    }
                        
                    item.choices.forEach( (c) => {
                        i = document.createElement("input") ;
                        i.type = "radio" ;
                        i.name = item.name ;
                        i.value = c ;
                        if ( c == v ) {
                            i.checked = true ;
                            i.disabled = false ;
                        } else {
                            i.disabled = true ;
                        }
                        i.title = item.hint ;
                        l.appendChild(i) ;
                        l.appendChild( document.createTextNode(c) ) ;
                    }) ;
                    break ;
                case "list":
                    var v  = "" ;
                    var any_choices = item.choices.length > 0 ;
                    if ( item.name in doc ) {
                        v = doc[item.name] ;
                    } else if ( any_choices ) {
                        v = item.choices[0] ;
                    }
                    var dlist = document.createElement("datalist") ;
                    dlist.id = 'datalist'+idx ;
                        
                    item.choices.forEach( (c) => {
                        var op = document.createElement("option") ;
                        op.value = c ;
                        dlist.appendChild(op) ;
                        }) ;
                    var id = document.createElement("input") ;
                    id.type = "list" ;
                    id.setAttribute( "list", dlist.id );
                    id.value = v ;
                    id.readonly = true ;
                    id.disabled = true ;
                    l.appendChild( dlist ) ;
                    l.appendChild( id ) ;                    
                    break ;
                case "datetime":
                case "datetime-local":
                    var d = null ;
                    if ( item.name in doc ) { 
                        d = new Date( doc[item.name] ) ;
                    }
                    this.DateTimetoInput(d).forEach( (f) => l.appendChild(f) ) ;
                    break ;
                case "date":
                    var v  = "" ;
                    if ( item.name in doc ) { 
                        v = doc[item.name] ;
                    }
                        
                    var id = document.createElement("input") ;
                    id.type = "text" ;
                    id.pattern="\d+-\d+-\d+" ;
                    id.size = 10 ;
                    id.value = v ;
                    id.title = "Date in format YYYY-MM-DD" ;
                    
                    l.appendChild(id) ;
                    break ;
                case "time":
                    var v  = "" ;
                    if ( item.name in doc ) { 
                        v = doc[item.name] ;
                    }
                        
                    var it = document.createElement("input") ;
                    it.type = "text" ;
                    it.pattern="[0-1][0-9]:[0-5][0-9] [A|P]M" ;
                    it.size = 9 ;
                    it.value = v ;
                    it.title = "Time in format HH:MM PM or HH:MM AM" ;
                    
                    l.appendChild(it) ;
                    break ;
                case "length":
                    var v  = 0 ;
                    if ( item.name in doc ) { 
                        v = doc[item.name] ;
                    }
                        
                    var it = document.createElement("input") ;
                    it.type = "text" ;
                    it.pattern="\d+:[0-5][0-9]" ;
                    it.size = 6 ;
                    it.value = this.HMfromMin(v) ;
                    it.title = "Time length in format HH:MM" ;
                    
                    l.appendChild(it) ;
                    break ;
                  case "checkbox":
                    i = document.createElement("input");
                    i.type = item.type ;
                    i.title = item.hint ;
                    i.checked = doc[item.name] ;
                    i.disabled = true ;
                    l.appendChild(i) ;
                    break ;
                case "textarea" :
                    if ( i == null ) {
                        i = document.createElement("textarea") ;
                    }
                    // fall through
                default:
                    if ( i == null ) {
                        i = document.createElement("input") ;
                        i.type = item.type ;
                    }
                    i.title = item.hint ;
                    i.readOnly = true ;
                    i.value = "" ;
                    if ( item.name in doc ) {
                        i.value = doc[item.name] ;
                    }
                    l.appendChild(i) ;
                    break ;
            }                
            
            ul.appendChild( li ) ;
        });
        
        return ul ;
    }

    DateTimetoInput( d ) {
        var vdate ;
        var vtime ;
        try {
            [vdate, vtime] =  [ this.YYYYMMDDfromDate( d ), this.AMfrom24( d.getHours(), d.getMinutes() ) ] ;
            }
        catch( err ) {
            [vdate, vtime] = [ "", "" ] ;
            }
            
        var id = document.createElement("input") ;
        id.type = "text" ;
        id.size = 10 ;
        id.pattern="\d+-\d+-\d+" ;
        id.value = vdate ;
        id.title = "Date in format YYYY-MM-DD" ;
        
        var it = document.createElement("input") ;
        it.type = "text" ;
        it.pattern="[0-1][0-9]:[0-5][0-9] [A|P]M" ;
        it.size = 9 ;
        it.value = vtime ;
        it.title = "Time in format HH:MM AM or HH:MM PM" ;
        return [ id, it ] ;
    }

    DateTimefromInput( field ) {
        var i = field.querySelectorAll("input") ;
        try {
            var d =  this.YYYYMMDDtoDate( i[0].value ) ; // date
            
            try {
                var t = this.AMto24( i[1].value ) ; // time
                d.setHours( t.hr ) ;
                d.setMinutes( t.min ) ;
                } 
            catch( err ) {
                }
            // convert to local time
            return d.toISOString() ;
            }
        catch( err ) {
            return "" ;
            }
    }


    HMtoMin ( inp ) {
        if ( typeof inp != 'string' ) {
            throw "bad" ;
        }
        var d = inp.match( /\d+/g ) ;
        if ( (d == null) || d.length < 2 ) {
            throw "bad" ;
        }
        return parseInt(d[0]) * 60 + parseInt(d[1]) ;
    }
        
    HMfromMin ( min ) {
        if ( typeof min == 'number' ) {
            return (Math.floor(min/60)+100).toString().substr(-2) + ":" + ((min%60)+100).toString().substr(-2) ;
        } else {
            return "00:00" ;
        }
    }
        
    AMto24( inp ) {
        if ( typeof inp != 'string' ) {
            throw "bad" ;
        }
        var d = inp.match( /\d+/g ) ;
        if ( (d == null) || d.length < 2 ) {
            throw "bad" ;
        } else if ( /PM/i.test(inp) ) {
            return {
                hr: parseInt(d[0])+12,
                min: parseInt(d[1]),
            } ;
        } else {
            return {
                hr: parseInt(d[0]),
                min: parseInt(d[1]),
            } ;
        }
    }

    AMfrom24( hr, min ) {
        if ( hr < 13 ) {
            return (hr+100).toString().substr(-2) + ":" + (min+100).toString().substr(-2) + " AM" ;
        } else {
            return (hr+100-12).toString().substr(-2) + ":" + (min+100).toString().substr(-2) + " PM" ;
        }
    }

    YYYYMMDDtoDate( inp ) {
        if ( typeof inp != 'string' ) {
            throw "bad" ;
        }
        var d = inp.match( /\d+/g ) ;
        if ( d.length < 3 ) {
            throw "bad" ;
        }
        return new Date( d[0],d[1],d[2] ) ;
    }

    YYYYMMDDfromDate( d ) {
        if ( d instanceof Date ) {
            if ( d.getTime() > 0 ) {
                return [
                    d.getFullYear(),
                    d.getMonth(),
                    d.getDate(),
                    ].join("-") ;
            }
        }
        throw "bad" ;
    }

    toLocalString( d ) {
        if ( d instanceof Date ) {
            return new Date( d.getTime() - d.getTimezoneOffset()*1000 ).toISOString() ;
        } else {
            return "" ;
        }
    }

    ButtonStatus( bool ) {
        [...document.getElementsByClassName('savedata')].forEach( (e) => {
            e.disabled = bool ;
        });
        [...document.getElementsByClassName('discarddata')].forEach( (e) => {
            e.disabled = bool ;
        });
    }
    
    fsclick( target ) {
        if ( this.pairs > 1 ) {
            let ul = target.parentNode.parentNode.querySelector("ul") ;
            if ( target.value === "show" ) {
                // hide
                target.innerHTML = "&#10133;" ;
                ul.style.display = "none" ;
                target.value = "hide" ;
            } else {
                // show
                target.innerHTML = "&#10134;" ;
                ul.style.display = "" ;
                target.value = "show" ;
            }
        }
    }                

    clickEdit() {
        this.ButtonStatus( false ) ;
        for ( let ipair=0 ; ipair<this.pairs ; ++ipair ) {
            let doc    = this.doc[ipair] ;
            let struct = this.struct[ipair] ;
            let ul     = this.ul[ipair] ;
            ul.querySelectorAll("li").forEach( (li) => {
                let idx = li.getAttribute("data-index") ;
                switch ( struct[idx].type ) {
                    case "radio":
                        document.getElementsByName(struct[idx].name).forEach( (i) => i.disabled = false ) ;
                        break ;
                    case "checkbox":
                        li.querySelector("input").disabled = false ;
                        parent.querySelector("input").readOnly = false ;
                        break ;
                    case "date":
                        picker.attach({
                            element: li.querySelector("input"),
                        }) ;
                        break ;
                    case "time":
                        tp.attach({
                            element: li.querySelector("input"),
                        }) ;
                        break ;
                    case "length":
                        lp.attach({
                            element: li.querySelector("input"),
                        }) ;
                        break ;
                    case "datetime":
                    case "datetime-local":
                        var i = li.querySelectorAll("input") ;
                        picker.attach({
                            element: i[0],
                        }) ;
                        tp.attach({
                            element: i[1],
                        }) ;
                        break ;
                    case "textarea":
                        li.querySelector("textarea").readOnly = false ;
                        break ;
                    case "list":
                        li.querySelector("input").readOnly = false ;
                        li.querySelector("input").disabled = false ;
                        break ;
                    default:
                        li.querySelector("input").readOnly = false ;
                        break ;
                }
            }) ;
        }
        [...document.getElementsByClassName("edit_note")].forEach( (e) => {
            e.disabled = true ;
        }) ;
    }
    
    loadDocData() {
        //return true if any real change
        let changed = [] ; 
        for ( let ipair=0 ; ipair<this.pairs ; ++ipair ) {
            let doc    = this.doc[ipair] ;
            let struct = this.struct[ipair] ;
            let ul     = this.ul[ipair] ;
            changed[ipair] = false ;
            ul.querySelectorAll("li").forEach( (li) => {
                let idx = li.getAttribute("data-index") ;
                let v = "" ;
                let name = struct[idx].name ;
                switch ( struct[idx].type ) {
                    case "radio":
                        document.getElementsByName(name).forEach( (i) => {
                            if ( i.checked == true ) {
                                v = i.value ;
                            }
                        }) ;
                        break ;
                    case "datetime":
                    case "datetime-local":
                        v = this.DateTimefromInput( li ) ;
                        break ;
                    case "checkbox":
                        v = li.querySelector("input").checked ;
                        break ;
                    case "length":
                        v = this.HMtoMin( li.querySelector("input").value ) ;
                        break ;
                    case "textarea":
                        v = li.querySelector("textarea").value ;
                        break ;
                    default:
                        v = li.querySelector("input").value ;
                        break ;
                }
                if ( doc[name]==undefined || doc[name] != v ) {
                    changed[ipair] = true ;
                    doc[name] = v ;
                }
            }) ;
        }
        return changed ;
    }
    
    saveChanged ( state ) {
        let changed = this.loadDocData() ;
        Promise.all( this.doc.filter( (doc, idx) => changed[idx] ).map( (doc) => db.put( doc ) ) )
            .catch( (err) => console.log(err) )
            .finally( () => showPage( state )
        ) ;
    }
    
    savePatientData() {
        this.saveChanged( "PatientPhoto" ) ;
    }
}

class OperationData extends PatientData {
    savePatientData() {
        this.saveChanged( "OperationList" ) ;
    }
}

class SettingData extends PatientData {
    savePatientData() {
        this.loadDocData() ;
        if ( userName != this.doc[0].userName ) {
            if ( userName != this.doc[0].userName ) {
                // username changed
                LocalRec = new Local( this.doc[0].userName ) ;
                LocalRec.init()
                .then( () => LocalRec.setDoc( this.doc ) )
                .then( () => {
                    showPage( "MainMenu" ) ;
                    window.location.reload(false) ;
                    })
                .catch( (err) => {
                    console.log(err) ;
                    showPage( "MainMenu" ) ;
                    }) ;
            } else {
                this.saveChanged( "MainMenu" ) ;
            }
        } else {
            showPage( "MainMenu" ) ;
        }
    }
}

class NewPatientData extends PatientData {
    constructor(...args) {
        super(...args) ;
        this.clickEdit() ;
    }
    
    savePatientData() {
        this.loadDocData() ;
        if ( this.doc[0].FirstName == "" ) {
            alert("Need a First Name") ;
        } else if ( this.doc[0].LastName == "" ) {
            alert("Need a Last Name") ;
        } else if ( this.doc[0].DOB == "" ) {
            alert("Enter some Date Of Birth") ;
        } else {
            this.doc[0]._id = makePatientId( this.doc[0] ) ;
            this.doc[0].type = "patient" ;
            db.put( this.doc[0] )
            .then( (response) => {
                selectPatient() ;
                showPage( "PatientPhoto" ) ;
                })
            .catch( (err) => console.log(err) ) ;
        }
    }
}

class PreLocal {
    constructor ( user = "<not set yet>" ) {
        document.getElementById("userstatus").value = user ;
    }
    setValue( key, val ) {}
    getValue( key ) {}
    delValue( key ) {}
}

class Local extends PreLocal {
    constructor( user ) {
        super( user ) ;
        userName = user ;
        setCookie( "userName", userName ) ;
        this.id = [" _local", user ].join("/" ) ;
        this.readIn = false;
        // default 
        this.doc = {
            userName: user ,
            remoteCouch: cloudantDb ,
            _id: this.id,
            
        } ;
    }
    
    init() {
        this._read() ;
    }

    setValue( key, val ) {
        this._read()
        .then( (doc) => {
            if ( this.doc[key] != val ) {
                this.doc[key] = val ;
                this._write() ;
            }
            }) ;
    }
    
    getValue( key ) {
        this._read()
        .then( (doc) => this.doc[key] ) ;
    }
    
    getGlobal( key ) {
        this._read()
        .then( (doc) => {
            window[key] = this.doc[key] ;
            return true ;
            }) ;
    }
    
    delValue( key ) {
        delete this.doc[key] ;
    }
    
    setDoc( doc ) {
        Object.entries(doc).forEach( ( k,v ) => this.doc[k] = v ) ;
        return this._write() ;
    }
        
    getDoc() {
        return this.doc ;
    }

    _read() {
        if ( this.readIn ) {
            return Promise.resolve(this.doc) ;
        }
        return db.get( this.id )
        .then( (doc) => {
            this.doc = doc ;
            this.readIn = true ;
            })
        .catch( (err) => this._write() ) ;
    }
    
    _write() {
        return db.put(this.doc)
        .then( (response) => this.doc._rev = response.rev )
        .catch( (err) => {
            console.log(err) ;
            return null ;
            }) ;
    }
}
   
function UserNameInput() {
    const un = document.getElementById("UserNameText");
    if ( un.value && un.value.length > 0 ) {
        LocalRec = new Local( un.value ) ;
        displayState = LocalRec.getValue( "displayState" ) ;
        userName     = LocalRec.getValue( "userName" ) ;
        patientId    = LocalRec.getValue( "patientId" ) ;
        noteId    = LocalRec.getValue( "noteId" ) ;
        operationId  = LocalRec.getValue( "operationId" ) ;
        remoteCouch  = LocalRec.getValue( "remoteCouch" ) ;
        
        if ( patientId ) {
            selectPatient( patientId ) ;
        } else {
            unselectPatient() ;
        }
        showPage( "PatientList" ) ;
    } else {
        showPage( "UserName" ) ;
    }
}
            
class Tbar {
    constructor() {
        this.is_active = false ;
    }

    active() {
        // in edit mode already?
        return this.is_active ;
    }

    enter() {
        this.is_active = true ;
        this.buttonsdisabled(true) ;
    }
    
    leave(page) {
        this.is_active = false ;
        this.buttonsdisabled(false) ;
        showPage(page) ;
    }

    fieldset( existingdiv, toolbarclass ) {
        this.existing = {} ;
        this.existing.parent  = existingdiv ;
        this.existing.textDiv = existingdiv.querySelector( ".entryfield_text" ) ;
        this.existing.oldText = "" ;
        this.existing.img     = existingdiv.querySelector( ".entryfield_image" ) ;
        if ( this.existing.textDiv ) {
            this.existing.oldText = this.existing.textDiv.innerText ;
        } else {
            this.existing.textDiv = document.createElement("div") ;
            this.existing.textDiv.classList.add("entryfield_text") ;
            this.existing.oldText = "" ;
        }

        this.working = {} ;
        this.working.parent  = existingdiv ;
        this.working.toolbar = document.getElementById("templates").querySelector(toolbarclass).cloneNode(true) ;
        this.working.newText = this.existing.oldText ;
        this.working.textDiv = document.createElement("div") ;
        this.working.textDiv.innerText = this.existing.oldText ;
        this.working.textDiv.contentEditable = true ;
        this.working.img     = document.createElement("img") ;
        this.working.img.classList.add("entryfield_image") ;
        this.working.upload = null
    }

    buttonsdisabled( bool ) {
        for ( let b of document.getElementsByClassName( "libutton" ) ) {
            b.disabled = bool ;
        }
        for ( let b of document.getElementsByClassName( "divbutton" ) ) {
            b.disabled = bool ;
        }
    }

    deleteedit() {
        this.deletefunc() ;
        this.leave("NoteList") ;
    }

    getImage() {
        this.working.toolbar.querySelector(".imageBar").click() ;
    }

    handleImage() {
        const files = this.working.parent.querySelector('.imageBar')
        this.working.upload = files.files[0];
        this.working.img.src = URL.createObjectURL(this.working.upload) ;
        this.working.img.style.display = "block" ;
        this.working.toolbar.querySelector(".tbarxpic").disabled = false ;
    }

    removeImage() {
        this.working.img.style.display = "none" ;
        this.working.upload = "remove" ;
        this.working.toolbar.querySelector(".tbarxpic").disabled = true ;
    }
}

class Nbar extends Tbar {
    // for notes
    startedit( existingdiv ) {
        if ( this.active() ) {
            return false ;
        }
        this.enter()
        if ( noteId ) {
            selectNote(existingdiv.getAttribute("data-id")) ;
            this.buttonsdisabled( true ) ;
            this.deletefunc = deleteNote ;
        } else {
            unselectNote() ;
            this.deletefunc = null ;
        }
        this.fieldset( existingdiv, ".editToolbar" ) ;
        if ( this.existing.textDiv == null ) {
            this.existing.textDiv = document.createElement("div") ;
            this.existing.textDiv.classList.add("entryfield_text") ;
            this.existing.oldText = "" ;
        }
            
        this.working.toolbar.querySelector(".tbarxpic").disabled = (this.existing.img  == null) ;
        this.working.toolbar.querySelector(".tbardel").style.visibility = (this.deletefunc!=null) ? "visible" : "hidden" ;

        if ( this.existing.img  ) {
            this.working.img.src = this.existing.img.src ;
            this.working.img.style.display = "block" ;
        } else {
            this.working.img.style.display = "none" ;
        }

        // elements of the working fields
        this.working.parent.innerHTML = "" ;
        this.working.parent.appendChild(this.working.img ) ;
        this.working.parent.appendChild(this.working.toolbar) ;
        this.working.parent.appendChild(this.working.textDiv) ;
        return true ;
    }

    saveedit() {
        if ( this.active() ) {
            if ( noteId ) {
                // existing note
                db.get(noteId)
                .then( (doc) => {
                    doc.text = this.working.textDiv.innerText ;
                    doc.patient_id = patientId ;
                    if ( this.working.upload == null ) {
                    } else if ( this.working.upload === "remove") {
                        deleteImageFromDoc( doc ) ;
                    } else {
                        putImageInDoc( doc, this.working.upload.type, this.working.upload ) ;
                    }
                    return db.put( doc ) ;
                    })
                .catch( (err) => console.log(err) )
                .finally( () => this.leave("NoteList") ) ;
            } else {
                // new note
                let doc = {
                    _id: makeNoteId(),
                    author: userName,
                    text: this.working.textDiv.innerText,
                    patient_id: patientId,
                    type: "note",
                    date: new Date().toISOString(),
                } ;
                if (this.working.upload && this.working.upload !== "remove") {
                    putImageInDoc( doc, this.working.upload.type, this.working.upload ) ;
                }                
                db.put(doc)
                .catch( (err) => console.log(err) )
                .finally( () => this.leave("NoteList") ) ;
            }
        }
    }
}
    
var editBar = new Nbar() ;        

class Pbar extends Tbar {
    // for PatientPhoto
    startedit() {
        let existingdiv = document.getElementById("PatientPhotoContent") ;
        if ( this.active() ) {
            return false ;
        }
        this.enter() ;
        this.fieldset( existingdiv, ".photoToolbar" ) ;
        this.working.textDiv.contentEditable = false ;
            
        this.working.toolbar.querySelector(".tbarxpic").disabled = false ;

        this.working.img.src = this.existing.img.src ;
        this.working.img.style.display = "block" ;

        // elements of the working fields
        this.working.parent.innerHTML = "" ;
        this.working.parent.appendChild(this.working.img ) ;
        this.working.parent.appendChild(this.working.toolbar) ;
        this.working.parent.appendChild(this.working.textDiv) ;
        return true ;
    }

    removeImage() {
        this.working.upload = "remove" ;
        this.working.img.src = NoPhoto ;
    }

    saveedit() {
        if ( this.active() ) {
            if ( patientId ) {
                // existing LocalRec
                getThePatient( true )
                .then( (doc) => {
                    if ( this.working.upload == null ) {
                    } else if ( this.working.upload === "remove") {
                        deleteImageFromDoc( doc ) ;
                    } else {
                        putImageInDoc( doc, this.working.upload.type, this.working.upload ) ;
                    }
                    return db.put( doc ) ;
                })
                .catch( (err)  => console.log(err) )
                .finally( () => this.leave("PatientPhoto") ) ;
            }
        }
    }    
}
    
var photoBar = new Pbar() ;        

function selectPatient( pid ) {
    if ( patientId != pid ) {
        // change patient -- notes dont apply
        unselectNote() ;
    }
        
    patientId = pid ;
    // Check patient existence
    getThePatient(false)
    .then( (doc) => {
        LocalRec.setValue( "patientId", pid ) ;
        if ( displayState == "PatientList" ) {
            // highlight the list row
            let rows = document.getElementById("PatientList").rows ;
            for ( let i = 0 ; i < rows.length ; ++i ) {
                if ( rows[i].getAttribute("data-id") == pid ) {
                    rows[i].classList.add('choice') ;
                } else {
                    rows[i].classList.remove('choice') ;
                }
            }
        }
        document.getElementById("editreviewpatient").disabled = false ;
        document.getElementById( "titlebox" ).innerHTML = "Name: <B>"+doc.LastName+"</B>, <B>"+doc.FirstName+"</B>  DOB: <B>"+doc.DOB+"</B>" ;
        })
    .catch( (err) => {
        console.log(err) ;
        unselectPatient() ;
        }) ;
}

function selectOperation( oid ) {
    if ( operationId != oid ) {
        // change patient -- notes dont apply
        unselectOperation() ;
    }
        
    operationId = oid ;
    // Check patient existence
    db.get(operationId)
    .then( (doc) => {
        LocalRec.setValue( "operationId", oid ) ;
        if ( displayState == "OperationList" ) {
            // highlight the list row
            let rows = document.getElementById("OperationsList").rows ;
            for ( let i = 0 ; i < rows.length ; ++i ) {
                if ( rows[i].getAttribute("data-id") == oid ) {
                    rows[i].classList.add('choice') ;
                } else {
                    rows[i].classList.remove('choice') ;
                }
            }
        }
        document.getElementById("editreviewoperation").disabled = false ;
        })
    .catch( (err) => {
        console.log(err) ;
        unselectOperation() ;
        }) ;
}

function unselectPatient() {
    patientId = null ;
    LocalRec.delValue( "patientId" ) ;
    unselectNote() ;
    unselectOperation() ;
    if ( displayState == "PatientList" ) {
        let pt = document.getElementById("PatientTable") ;
        if ( pt ) {
            let rows = pt.rows ;
            for ( let i = 0 ; i < rows.length ; ++i ) {
                rows[i].classList.remove('choice') ;
            }
        }
    }
    document.getElementById("editreviewpatient").disabled = true ;
    document.getElementById( "titlebox" ).innerHTML = "" ;
}

function unselectOperation() {
    operationId = null ;
    LocalRec.delValue( "operationId" ) ;
    if ( displayState == "OperationList" ) {
        let ot = document.getElementById("OperationsList") ;
        if ( ot ) {
            let rows = ot.rows ;
            for ( let i = 0 ; i < rows.length ; ++i ) {
                rows[i].classList.remove('choice') ;
            }
        }
    }
    document.getElementById("editreviewoperation").disabled = true ;
}

function showPage( state = "PatientList" ) {
    displayState = state ;

    Array.from(document.getElementsByClassName("pageOverlay")).forEach( (v) => v.style.display = v.classList.contains(displayState) ? "block" : "none" );

    LocalRec.setValue("displayState",displayState) ;

    objectPatientData = null ;
    objectNoteList = null ;

    switch( displayState ) {
        case "UserName":
            document.getElementById("UserNameText").addEventListener( "keyup", (event)=> {
                if ( event.key === "Enter" ) {
                    UserNameInput() ;
                }
            });
            break ;
           
       case "MainMenu":
            break ;
            
        case "SettingMenu":
            objectPatientData = new SettingData( LocalRec.getDoc() , structSetting ) ;
            break ;
            
        case "PatientList":
            let objectPatientTable = new PatientTable( ["LastName", "FirstName", "DOB","Dx" ] ) ;
            getPatients(true)
            .then( (docs) => {
                objectPatientTable.fill(docs.rows) ;
                if ( patientId ) {
                    selectPatient( patientId ) ;
                } else {
                    unselectPatient() ;
                }
                })
            .catch( (err) => console.log(err) ) ;
            break ;
            
        case "OperationList":
            let objectOperationTable = new OperationTable( [ "Procedure", "Surgeon", "Status", "Schedule", "Duration", "Equipment" ]  ) ;
            getOperations(true)
            .then( (docs) => objectOperationTable.fill(docs.rows) )
            .catch( (err) => console.log(err) );
            break ;
            
        case "OperationNew":
            unselectOperation() ;
            showPage( "OperationEdit" ) ;
            break ;
        
        case "OperationEdit":
            if ( patientId ) {
                if ( operationId ) {
                    db.get( operationId )
                    .then( (doc) => objectPatientData = new OperationData( doc, structOperation ) )
                    .catch( (err) => {
                        console.log(err) ;
                        showPage( "InvalidPatient" ) ;
                        }) ;
                } else {
                    objectPatientData = new OperationData(
                    {
                        _id: makeOperationId(),
                        patient_id: patientId,
                        author: userName,
                    } , structOperation ) ;
                }
            } else {
                showPage( "PatientList" ) ;
            }
            break ;
            
        case "PatientNew":
            unselectPatient() ;
            objectPatientData = new NewPatientData( { author: userName, }, structNewPatient ) ;
            break ;
            
        case "PatientPhoto":
            if ( patientId ) {
                selectPatient( patientId ) ;
                getThePatient( true )
                .then( (doc) => PatientPhoto( doc ) )
                .catch( (err) => {
                    console.log(err) ;
                    showPage( "InvalidPatient" ) ;
                    }) ;
            } else {
                showPage( "PatientList" ) ;
            }
            break ;
            
        case "PatientDemographics":
            if ( patientId ) {
                getThePatient( false )
                .then( (doc) => objectPatientData = new PatientData( doc, structDemographics ) )
                .catch( (err) => {
                    console.log(err) ;
                    showPage( "InvalidPatient" ) ;
                    }) ;
            } else {
                showPage( "PatientList" ) ;
            }
            break ;
            
        case "PatientMedical":
            if ( patientId ) {
                var args ;
                getThePatient( false )
                .then( (doc) => {
                    args = [doc,structMedical] ;
                    return getOperations(true) ;
                    })
                .then( ( olist ) => {
                    olist.rows.forEach( (r) => args.push( r.doc, structOperation ) ) ;
                    //objectPatientData = new PatientData( doc, structMedical ) ;
                    objectPatientData = new PatientData( ...args ) ;
                    })
                .catch( (err) => {
                    console.log(err) ;
                    showPage( "InvalidPatient" ) ;
                    }) ;
            } else {
                showPage( "PatientList" ) ;
            }
            break ;
            
        case "InvalidPatient":
            unselectPatient() ;
            break ;

        case "NoteList":            
            if ( patientId ) {
                getThePatient( false )
                .then( (doc) => objectNoteList = new NoteList( NoteListContent ) )
                .catch( (err) => {
                    console.log(err) ;
                    showPage( "InvalidPatient" ) ;
                    }) ;
            } else {
                showPage( "PatientList" ) ;
            }
            break ;
            
         case "NoteNew":
            if ( patientId ) {
                // New note only
                unselectNote() ;
                NoteNew() ;
            } else {
                showPage( "PatientList" ) ;
            }
            break ;
            
       case "NoteImage":
            if ( patientId ) {
                NoteImage() ;
            } else {
                showPage( "PatientList" ) ;
            }
            break ;
            
        default:
            showPage( "PatientList" ) ;
            break ;
    }
}

function setCookie( cname, value ) {
  // From https://www.tabnine.com/academy/javascript/how-to-set-cookies-javascript/
    let date = new Date();
    date.setTime(date.getTime() + (400 * 24 * 60 * 60 * 1000)); // > 1year
    const expires = " expires=" + date.toUTCString();
    document.cookie = cname + "=" + encodeURIComponent(value) + "; " + expires + "; path=/";
}

function deleteCookie( cname ) {
    document.cookie = cname +  "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
}

function getCookie( cname ) {
      const name = cname + "=";
      var ret = null ;
      decodeURIComponent(document.cookie).split('; ').forEach( (val) => {
          if (val.indexOf(name) === 0) {
              ret =  val.substring(name.length) ;
          }
      }) ;
      return ret;
}

function isAndroid() {
    return navigator.userAgent.toLowerCase().indexOf("android") > -1 ;
}

class SortTable {
    constructor(tname) {
        this.dir = 1 ;
        this.lastth = -1 ;
        this.tname = tname ;
        tname.onclick = this.allClick.bind(this) ;
    }

    allClick(e) {
        if (e.target.tagName == 'TH') {
            return this.sortClick(e) ;
        }
    };

    resort() {
        if ( this.lastth < 0 ) {
            this.lastth = 0 ;
            this.dir = 1 ;
        }
        this.sortGrid(this.lastth) ;
    }

    sortClick(e) {
        let th = e.target;
        if ( th.cellIndex == this.lastth ) {
            this.dir = -this.dir ;
        } else {
            this.dir = 1;
            this.lastth = th.cellIndex
        }
        // if TH, then sort
        // cellIndex is the number of th:
        //   0 for the first column
        //   1 for the second column, etc
        this.sortGrid(th.cellIndex);
    };

    sortGrid(colNum) {
        unselectPatient() ;
        let tbody = this.tname.querySelector('tbody');
        if ( tbody == null ) {
            // empty table
            return ;
        }

        let rowsArray = Array.from(tbody.rows);

        let type = "number" ;
        rowsArray.some( (r) => {
            let c = r.cells[colNum].innerText ;
            if ( c == "" ) {
            } else if ( isNaN( Number(r.cells[colNum].innerText) ) ) {
                type = "string" ;
                return true ;
            } else {
                return true ;
            }
        });

        // compare(a, b) compares two rows, need for sorting
        let dir = this.dir ;
        let compare;

        switch (type) {
            case 'number':
                compare = (rowA, rowB) => (rowA.cells[colNum].innerText - rowB.cells[colNum].innerText) * dir ;
                break;
            case 'string':
                compare = (rowA, rowB) => rowA.cells[colNum].innerText > rowB.cells[colNum].innerText ? dir : -dir ;
                break;
        }

        // sort
        rowsArray.sort(compare);

        tbody.append(...rowsArray);
    }
}

class PatientTable extends SortTable {
    constructor( collist ) {
        let tbl = document.getElementById("PatientList") ;
        tbl.innerHTML = "" ;

        // Table Head
        let header = tbl.createTHead() ;
        let row = header.insertRow(0);
        row.classList.add('head') ;
        collist.forEach( (v,i) => row.insertCell(i).outerHTML='<th>'+v+'</th>' );

        // Table Body
        let tbody = document.createElement('tbody');
        tbl.appendChild(tbody) ;
        super(tbl) ;
        this.collist = collist ;
    }

    fill( doclist ) {
        // typically called with doc.rows from allDocs
        let tbody = this.tname.querySelector('tbody') ;
        tbody.innerHTML = "" ;
        let collist = this.collist ;
        doclist.forEach( (doc) => {
            let row = tbody.insertRow(-1) ;
            let record = doc.doc ;
            row.setAttribute("data-id",record._id) ;
            if (record._id == patientId) {
                row.classList.add("choice") ;
            }
            row.addEventListener( 'click', (e) => {
                selectPatient( record._id ) ;
            }) ;
            row.addEventListener( 'dblclick', (e) => {
                selectPatient( record._id ) ;
                showPage( "PatientPhoto" ) ;
            }) ;
            collist.forEach( (colname,i) => {
                let c = row.insertCell(i) ;
                if ( colname in record ) {
                    c.innerText = record[colname] ;
                } else {
                    c.innerText = "" ;
                }
            }) ;
        });
    }
  
}

function makeNewOperation() {
    let doc = {
        _id: makeOperationId(),
        author: userName,
        type: "operation",
        Procedure: "Enter new procedure",
        Surgeon: "",
        "Date-Time": "",
        Duration: "",
        Laterality: "?",
        Status: "none",
        Equipment: "",
        patient_id: patientId,
    } ;
    return db.put( doc ) ;
}

class OperationTable extends SortTable {
    constructor( collist ) {
        let tbl = document.getElementById("OperationsList") ;
        tbl.innerHTML = "" ;
          
        // Table Head
        let header = tbl.createTHead() ;
        let row = header.insertRow(0);
        row.classList.add('head') ;
        collist.forEach( (v,i) => row.insertCell(i).outerHTML='<th>'+v+'</th>' );

        // Table Body
        let tbody = document.createElement('tbody');
        tbl.appendChild(tbody) ;
        super(tbl) ;
        this.collist = collist ;
    }

    fill( doclist ) {
        // typically called with doc.rows from allDocs
        let tbody = this.tname.querySelector('tbody') ;
        tbody.innerHTML = "" ;
        let collist = this.collist ;
        doclist.forEach( (doc) => {
            let row = tbody.insertRow(-1) ;
            let record = doc.doc ;
            row.setAttribute("data-id",record._id) ;
            if (record._id == operationId ) {
                row.classList.add("choice") ;
            }
            row.addEventListener( 'click', (e) => {
                selectOperation( record._id ) ;
            }) ;
            row.addEventListener( 'dblclick', (e) => {
                selectOperation( record._id ) ;
                showPage( "OperationEdit" ) ;
            }) ;
            collist.forEach( (colname,i) => {
                let c = row.insertCell(i) ;
                if ( colname in record ) {
                    c.innerText = record[colname] ;
                } else {
                    c.innerText = "" ;
                }
            }) ;
        });
    }
  
}

function makePatientId( doc_or_pos ) {
	switch ( typeof(doc_or_pos ) ) {
		case "string":
			switch (doc_or_pos) {
				case "first":
					return [ 
						RecordFormat.type.patient,
						RecordFormat.version,
						"!",
						"",
						"", 
						].join(";") ;
				case "last":
					return [ 
						RecordFormat.type.patient,
						RecordFormat.version,
						"\\fff0",
						"",
						"", 
						].join(";") ;
				}
			break ;
		case "object":
			return [ 
				RecordFormat.type.patient,
				RecordFormat.version,
				doc_or_pos.LastName,
				doc_or_pos.FirstName,
				doc_or_pos.DOB, 
				].join(";") ;
		}
    console.log("Call for unrecognized Patient Id type") ;
    return null ;
}

function splitPatientId( pid = patientId ) {
    if ( pid ) {
        var spl = pid.split(";") ;
        if ( spl.length !== 5 ) {
            return null ;
        }
        return {
            type: spl[0],
            version: spl[1],
            last : spl[2],
            first: spl[3],
            dob: spl[4],
        } ;
    }
    return null ;
}

function makeNoteId(position=null) {
    let d ;
    switch (position) {
        case "veryfirst":
            d = "" ;
			return [ 
				RecordFormat.type.note,
				RecordFormat.version,
				d ,
				d ,
				d ,
				d , 
				].join(";") ;
        case "first":
            d = "" ;
            break ;
        case "last":
            d = "\\fff0" ;
            break ;
        case "verylast":
            d = "\\fff0" ;
			return [ 
				RecordFormat.type.note,
				RecordFormat.version,
				d ,
				d ,
				d ,
				d , 
				].join(";") ;
        default:
            d = new Date().toISOString() ;
            break;
    }
    let spl = splitPatientId() ;
    
    return [ 
        RecordFormat.type.note,
        RecordFormat.version,
        spl.last,
        spl.first,
        spl.dob,
        d , 
        ].join(";") ;
}

function makeOperationId(position=null) {
    let d ;
    switch (position) {
        case "veryfirst":
            d = "" ;
			return [ 
				RecordFormat.type.operation,
				RecordFormat.version,
				d,
				d,
				d,
				d , 
				].join(";") ;
        case "first":
            d = "" ;
            break ;
        case "verylast":
            d = "\\fff0" ;
			return [ 
				RecordFormat.type.operation,
				RecordFormat.version,
				d,
				d,
				d,
				d , 
				].join(";") ;
        case "last":
            d = "\\fff0" ;
            break ;
        default:
            d = new Date().toISOString() ;
            break;
    }
    let spl = splitPatientId() ;
    
    return [ 
        RecordFormat.type.operation,
        RecordFormat.version,
        spl.last,
        spl.first,
        spl.dob,
        d , 
        ].join(";") ;
}

function splitNoteId( nid=noteId ) {
    if ( nid ) {
        var spl = nid.split(";") ;
        if ( spl.length !== 6 ) {
            return null ;
        }
        return {
            type: spl[0],
            version: spl[1],
            last: spl[2],
            first: spl[3],
            dob: spl[4],
            key: spl[5],
        } ;
    }
    return null ;
}

function splitOperationId( oid = operationId ) {
    if ( oid ) {
        var spl = oid.split(";") ;
        if ( spl.length !== 6 ) {
            return null ;
        }
        return {
            type: spl[0],
            version: spl[1],
            last: spl[2],
            first: spl[3],
            dob: spl[4],
            key: spl[5],
        } ;
    }
    return null ;
}

function deletePatient() {
    if ( patientId ) {        
        let pdoc ;
        let ndocs ;
        let odocs ;
        getThePatient( true )
            // get patient
        .then( (doc) => {
            pdoc = doc ;
            return getNotes(false) ;
            })
        .then( (docs) => {
            // get notes
            ndocs = docs.rows ;
            return getOperations (false) ;
            })
        .then( (docs) => {
            // get operations
            odocs = docs.rows ;
            // Confirm question
            let c = "Delete patient \n   " + pdoc.FirstName + " " + pdoc.LastName + " DOB: " + pdoc.DOB + "\n    " ;
            if (ndocs.length == 0 ) {
                c += "(no associated notes on this patient) \n   " ;
            } else {
                c += "also delete "+ndocs.length+" associated notes\n   " ;
            }
            if (odocs.length == 0 ) {
                c += "(no associated operations on this patient) \n   " ;
            } else {
                c += "also delete "+odocs.length+" associated operations\n   " ;
            }
            c += "Are you sure?" ;
            if ( confirm(c) ) {
                return true ;
            } else {
                throw "No delete" ;
            }           
            })
        .then( () => Promise.all(ndocs.map( (doc) => db.remove(doc.id,doc.value.rev) ) ) )
        .then( () => Promise.all(odocs.map( (doc) => db.remove(doc.id,doc.value.rev) ) ) )
        .then( () => db.remove(pdoc) )
        .then( () => unselectPatient() )
        .catch( (err) => console.log(err) ) 
        .finally( () => showPage( "PatientList" ) ) ;
    }
}

function PatientPhoto( doc ) {
    let d = document.getElementById("PatientPhotoContent") ;
    let c = document.getElementById("phototemplate") ;
    d.innerHTML = "" ;
    c.childNodes.forEach( cc => {
        d.appendChild(cc.cloneNode(true) ) ;
    });
    
    let p = document.getElementById("PatientPhotoContent").getElementsByTagName("img")[0] ;
    try {
        p.src = getImageFromDoc( doc ) ;
        }
    catch( err ) {
        p.src = NoPhoto ;
        }
}

function newImage() {
    unselectNote() ;
    showPage( "NoteImage" ) ;  
}

function deleteNote() {
    if ( noteId ) {
        let pdoc ;
        getThePatient( false )
        .then( (doc) => {
            pdoc = doc ;
            return db.get( noteId ) ;
            })
        .then( (doc) => {
            if ( confirm("Delete note on patient " + pdoc.FirstName + " " + pdoc.LastName + " DOB: " + pdoc.DOB + ".\n -- Are you sure?") ) {
                return doc ;
            } else {
                throw "No delete" ;
            }           
            })
        .then( (doc) => db.remove(doc) )
        .then( () => unselectNote() )
        .catch( (err) => console.log(err) )
        .finally( () => showPage( "NoteList" ) ) ;
    }
    return true ;
}    
    
function deleteOperation() {
    if ( operationId ) {
        let pdoc ;
        getThePatient( false )
        .then( (doc) => { 
            pdoc = doc ;
            return db.get( operationId ) ;
            })
        .then( (doc) => {
            if ( confirm("Delete operation\<"+doc.Procedure+">\n on patient " + pdoc.FirstName + " " + pdoc.LastName + " DOB: " + pdoc.DOB + ".\n -- Are you sure?") ) {
                return doc ;
            } else {
                throw "No delete" ;
            }           
            })
        .then( (doc) =>db.remove(doc) )
        .then( () => unselectOperation() )
        .catch( (err) => console.log(err) )
        .finally( () => showPage( "OperationList" ) ) ;
    }
    return true ;
}    
    
function selectNote( cid ) {
    noteId = cid ;
    LocalRec.setValue( "noteId", cid ) ;
    if ( displayState == "NoteList" ) {
        // highlight the list row
        let li = document.getElementById("NoteList").getElementsByTagName("LI");
        if ( li && (li.length > 0) ) {
            for ( let l of li ) {
                if ( l.getAttribute("data-id") == noteId ) {
                    l.classList.add('choice') ;
                } else {
                    l.classList.remove('choice') ;
                }
            }
        }
    }
}

function unselectNote() {
    noteId = null ;
    LocalRec.delValue( "noteId" ) ;
    if ( displayState == "NoteList" ) {
        let li = document.getElementById("NoteList").li ;
        if ( li && (li.length > 0) ) {
            for ( let l of li ) {
                l.classList.remove('choice') ;
            }
        }
    }
}

function noteTitle( doc ) {
    let date = new Date().toISOString() ;
    author = userName ;
    if ( doc  && doc.id ) {
        date = splitNoteId(doc.id).key ;
        console.log( "from key", date ) ;
        if ( doc.doc && doc.doc.author ) {
            author = doc.doc.author ;
        }
        if ( doc.doc && doc.doc.date ) {
            date = doc.doc.date ;
            console.log( "from doc", date ) ;
        }
    }
    return [author, new Date(date)] ;
}

function getThePatient(attachments) {
    return db.get( patientId, { attachments: attachments, binary: attachments } ) ;
}

function getPatients(attachments) {
    doc = {
        startkey: makePatientId("first"),
        endkey: makePatientId("last"),
    } ;
    if (attachments) {
        doc.include_docs = true ;
        doc.binary = true ;
        doc.attachments = true ;
    }

    return db.allDocs(doc) ;
}

function getOperationsAll() {
    doc = {
        startkey: makeOperationId("veryfirst"),
        endkey: makeOperationId("verylast"),
        include_docs: true,
        binary: true,
        attachments: true,
    } ;
	return db.allDocs(doc) ;
}

function getOperations(attachments) {
    doc = {
        startkey: makeOperationId("first"),
        endkey: makeOperationId("last"),
    } ;
    if (attachments) {
        doc.include_docs = true ;
        doc.binary = true ;
        doc.attachments = true ;

        // Adds a single "blank"
        // also purges excess "blanks"
        return db.allDocs(doc)
        .then( (doclist) => {
            let newlist = doclist.rows
                .filter( (row) => ( row.doc.Status === "none" ) && ( row.doc.Procedure === "Enter new procedure" ) )
                .map( row => row.doc ) ;
            switch ( newlist.length ) {
                case 0 :
                    throw null ;
                case 1 :
                    return Promise.resolve( doclist ) ;
                    break ;
                default:
                    throw newlist.slice(1) ;
                    break ;
                }
            })
        .catch( (dlist) => {
            if ( dlist == null ) {
                // needs an empty
                throw null ;
            }
            // too many empties
            console.log("Remove", dlist.length,"entries");
            return Promise.all(dlist.map( (doc) => db.remove(doc) ))
                .then( ()=> getOperations( attachments )
                ) ;
            })
        .catch( () => {
            console.log("Add a record") ;
            return makeNewOperation().then( () => getOperations( attachments ) ) ;
            });
    } else {
        return db.allDocs(doc) ;
    }
}

function getNoteAll() {
    doc = {
        startkey: makeNoteId("veryfirst"),
        endkey: makeNoteId("verylast"),
        include_docs: true,
        binary: false,
        attachments: false,
    } ;
	return db.allDocs(doc) ;
}

function getNotes(attachments) {
    doc = {
        startkey: makeNoteId("first"),
        endkey: makeNoteId("last"),
    }
    if (attachments) {
        doc.include_docs = true ;
        doc.binary = true ;
        doc.attachments = true ;
    }
    return db.allDocs(doc) ;
}

class NoteList extends PatientData {
    constructor( parent ) {
        super() ;
        if ( parent == null ) {
            parent = document.body ;
        }
        console.log("parent",parent) ;

        [...parent.getElementsByTagName('ul')].forEach( (u) => parent.removeChild(u) ) ;

        this.ul = document.createElement('ul') ;
        this.ul.setAttribute( "id", "NoteList" ) ;
        parent.appendChild(this.ul) ;

        // get notes
        getNotes(true)
        .then( (docs) => {
            docs.rows.forEach( (note, i) => {
                let li1 = this.liLabel(note) ;
                this.ul.appendChild( li1 ) ;
                let li2 = this.liNote(note,li1) ;
                this.ul.appendChild( li2 ) ;

            }) ;
            this.li = this.ul.getElementsByTagName('li')
                
            })
        .catch( (err) => console.log(err) ) ; 
    }

    liLabel( note ) {
        let li = document.createElement("li") ;
        li.setAttribute("data-id", note.id ) ;

        li.appendChild( document.getElementById("templates").getElementsByClassName("edit_note")[0].cloneNode(true) );

        let cdiv = document.createElement("div");
        cdiv.classList.add("inly") ;
        let nt = noteTitle( note ) ;
        this.DateTimetoInput(nt[1]).forEach( (i) => cdiv.appendChild(i) ) ;
        cdiv.appendChild( document.createTextNode( " by "+nt[0]) ) ;
        let dbut = document.createElement("input") ;
        li.appendChild(cdiv) ;
        li.addEventListener( 'click', (e) => selectNote( note.id ) ) ;

        return li ;
    }

    liNote( note, label ) {
        let li = document.createElement("li") ;
        li.setAttribute("data-id", note.id ) ;
        if ( noteId == note.id ) {
            li.classList.add("choice") ;
        }
        if ( "doc" in note ) {
            try {
                let imagedata = getImageFromDoc( note.doc ) ;
                let img = document.createElement("img") ;
                img.classList.add("entryfield_image") ;
                img.src = imagedata ;
                li.appendChild(img);
                }
            catch(err) {
                console.log(err) ;
                }

            let textdiv = document.createElement("div") ;
            textdiv.innerText = ("text" in note.doc) ? note.doc.text : "" ;
            li.addEventListener( 'dblclick', (e) => {
                editBar.startedit( li ) ;
            }) ;
            textdiv.classList.add("entryfield_text") ;
            li.appendChild(textdiv);
        }    
        
        li.addEventListener( 'click', (e) => {
            selectNote( note.id ) ;
        }) ;
        label.getElementsByClassName("edit_note")[0].onclick =
            (e) => {
            var i = label.querySelectorAll("input") ;
            picker.attach({ element: i[0] }) ;
            tp.attach({ element: i[1] }) ;
            selectNote( note.id ) ;
            editBar.startedit( li ) ;
            } ;
        label.addEventListener( 'dblclick', (e) => {
            var i = label.querySelectorAll("input") ;
            picker.attach({ element: i[0] }) ;
            tp.attach({ element: i[1] }) ;
            selectNote( note.id ) ;
            editBar.startedit( li ) ;
            }) ;

        return li ;
    }

}

function getImageFromDoc( doc ) {
    if ( !("_attachments" in doc) ) {
        throw "No attachments" ;
    }
    if ( !("image" in doc._attachments) ) {
        throw "No image" ;
    }
    if ( !("data" in doc._attachments.image) ) {
        throw "No image data" ;
    }
    return URL.createObjectURL(doc._attachments.image.data) ;
}

function deleteImageFromDoc( doc ) {
    if ( "_attachments" in doc ) {
        delete doc["_attachments"] ;
    }
}

function putImageInDoc( doc, itype, idata ) {
    doc._attachments = {
        image: {
            content_type: itype,
            data: idata,
        }
    }
}

function NoteNew() {
    document.getElementById("NoteNewLabel").innerHTML = noteTitle()  ;
    let d = document.getElementById("NoteNewText") ;
    d.innerHTML = "" ;
    editBar.startedit( d ) ;
}

function NoteImage() {
    let inp = document.getElementById("imageInput") ;
    if ( isAndroid() ) {
        inp.removeAttribute("capture") ;
    } else {
        inp.setAttribute("capture","environment");
    }
}

function quickImage() {
    document.getElementById("imageQ").click() ;
}

function quickImage2() {
    const files = document.getElementById('imageQ') ;
    const image = files.files[0] ;

    let doc = {
        _id: makeNoteId(),
        text: "",
        author: userName,
    } ;
    putImageInDoc( doc, image.type, image ) ;

    db.put( doc )
    .then( (response) => showPage( "NoteList" ) )
    .catch( (err) => {
        console.log(err) ;
        showPage( "NoteList" ) ;
        }) ;
}

function getImage() {
    let inp = document.getElementById("imageInput") ;
    inp.click() ;
}
    
   
//let urlObject;
function handleImage() {
    const files = document.getElementById('imageInput')
    const image = files.files[0];

    // change display
    document.getElementsByClassName("NoteImage")[0].style.display = "none" ;
    document.getElementsByClassName("NoteImage2")[0].style.display = "block" ;

     // see https://www.geeksforgeeks.org/html-dom-createobjecturl-method/
    document.getElementById('imageCheck').src = URL.createObjectURL(image) ;
}    

function saveImage() {
    const files = document.getElementById('imageInput')
    const image = files.files[0];
    const text = document.getElementById("annotation").innerText ;

    let doc = {
        _id: makeNoteId(),
        text: text.value,
        author: userName,
    } ;
    putImageInDoc( doc, image.type, image ) ;

    db.put( doc )
    .then( (response) => showPage( "NoteList" ) )
    .catch( (err) => {
        console.log(err) ;
        showPage( "NoteList" ) ;
        }) ;
    document.getElementById('imageCheck').src = "" ;
}

function show_screen( bool ) {
    document.getElementById("splash_screen").style.display = "none" ;
    Array.from(document.getElementsByClassName("work_screen")).forEach( (v)=> {
        v.style.display = bool ? "block" : "none" ;
    });
    Array.from(document.getElementsByClassName("print_screen")).forEach( (v)=> {
        v.style.display = bool ? "none" : "block" ;
    });
}    

function printCard() {
    if ( patientId == null ) {
        return showPage( "InvalidPatient" ) ;
    }
    var card = document.getElementById("printCard") ;
    var t = card.getElementsByTagName("table") ;
    getThePatient( true )
    .then( (doc) => {
        show_screen( false ) ;
        console.log( "print",doc) ;
        var photo = document.getElementById("photoCard") ;
        var link = window.location.href + "?patientId=" + encodeURIComponent(patientId) ;
        var qr = new QR(
            card.querySelector(".qrCard"),
            link,
            200,200,
            4) ;
        try {
            photo.src = getImageFromDoc( doc ) ;
            console.log("Image gotten".doc)
            } 
        catch (err) {
            photo.src = "style/NoPhoto.png" ;
            console.log("No image",doc) ;
            }
        t[0].rows[0].cells[1].innerText = doc.LastName+"' "+doc.FirstName ;
        t[0].rows[1].cells[1].innerText = doc.Complaint ;
        t[0].rows[2].cells[1].innerText = "" ;
        t[0].rows[3].cells[1].innerText = "" ;
        t[0].rows[4].cells[1].innerText = "" ;
        t[0].rows[5].cells[1].innerText = doc.ASA ;

        t[1].rows[0].cells[1].innerText = doc.Age+"" ;
        t[1].rows[1].cells[1].innerText = doc.Sex ;
        t[1].rows[2].cells[1].innerText = doc.Weight+" kg" ;
        t[1].rows[3].cells[1].innerText = doc.Allergies ;
        t[1].rows[4].cells[1].innerText = doc.Meds ;
        t[1].rows[5].cells[1].innerText = "" ;
        return getOperations(true) ;
        })
    .then( (docs) => {
        var oleng = docs.rows.length ;
        if ( oleng > 0 ) {
            t[0].rows[2].cells[1].innerText = docs.rows[oleng-1].doc.Procedure ;
            t[0].rows[3].cells[1].innerText = docs.rows[oleng-1].doc.Duration + " hr" ;
            t[0].rows[4].cells[1].innerText = docs.rows[oleng-1].doc.Surgeon ;
            t[1].rows[5].cells[1].innerText = docs.rows[oleng-1].doc.Equipment ;
        }
        window.print() ;
        show_screen( true ) ;
        showPage( "PatientPhoto" ) ;
        })
    .catch( (err) => {
        console.log(err) ;
        showPage( "InvalidPatient" ) ;
        }) ;
}

function parseQuery() {
    s = window.location.search ;
    if ( s.length < 1 ) {
        return null ;
    }
    r = {} ;
    s.substring(1).split("&").forEach( (q) => {
        let qq = q.split("=") ;
        if ( qq.length== 2 ) {
            r[decodeURIComponent(qq[0])] = decodeURIComponent(qq[1]) ;
        }
    }) ;
    window.location.search = "" ;
    return r ;
};

// Pouchdb routines
(function() {

    'use strict';

    db.changes({
        since: 'now',
        live: true
    }).on('change', (change) => {
        switch (displayState) {
            case "PatientList":
            case "OperationList":
            case "PatientPhoto":
                showPage( displayState );
                break ;
            default:
                break ;
        }
    });

    // Initialise a sync with the remote server
    function sync() {
        let synctext = document.getElementById("syncstatus") ;
        synctext.value = "syncing..." ;
        db.sync( remoteCouch+"/"+cannonicalDBname , { live: true, retry: true, } )
        .on('change', (info)   => synctext.value = "changed -- " + info )
        .on('paused', ()       => synctext.value = "pending" )
        .on('active', ()       => synctext.value = "active" )
        .on('denied', (err)    => synctext.value = "denied " + err )
        .on('complete', (info) => synctext.value = "complete -- " + info )
        .on('error', (err)     => synctext.value = "Sync status: error "+err );
    }

    if (remoteCouch) {
        sync();
    }

    LocalRec = new PreLocal() ;
    
    // Initial start
    show_screen(true) ;
    
    // search field
    // No search, use cookies
    userName = getCookie( "userName" ) ;
    if ( !userName ) {
        showPage( "UserName" ) ;
    } else {
        LocalRec = new Local( userName ) ;
        Promise.all( [ "patientId", "commentId", "remoteCouch", "displayState" ].map( (key) => LocalRec.getGlobal(key) ))
        .then( () => {
        
            // first try the search field
            let q = parseQuery() ;
            if ( q && ( patientId in q ) ) {
                selectPatient( q.patientId ) ;
                showPage( "PatientPhoto" ) ;
            } else {
                console.log("switch",userName,displayState) ;
                switch ( displayState ) {
                    case "PatientList":
                    case "MainMenu":
                    case "PatientPhoto":
                    case "NoteList":
                    case "OperationList":
                    case "SettingMenu":
                        showPage( displayState ) ;
                        break;
                    case "OperationEdit":
                        showPage( "OperationList" ) ;
                        break ;
                    case "NoteNew":
                    case "NoteImage":
                        showPage( "NoteList" ) ;
                        break ;
                    case undefined:
                    case "UserName":
                    case "InvalidPatient":
                        showPage( "PatientList" ) ;
                        break ;
                    case "PatientNew":
                    case "PatientDemographics":
                    case "PatientMedical":
                    default:
                        showPage( "PatientPhoto" ) ;
                        break ;
                }
            }
            })
        .catch( (err) => {
            console.log(err) ;
            showPage( "MainMenu" ) ;
            }) ;
    }
        
    
})();
