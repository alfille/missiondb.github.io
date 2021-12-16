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
        choices: ["unscheduled", "scheduled", "finished", "postponed", "cancelled"],
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

class PatientData {
    constructor( doc, struct ) {
        this.parent = document.getElementById("PatientDataContent") ;
        this.doc = doc ;
        this.struct = struct ;
        
        this.ButtonStatus( true ) ;
        picker.detach() ;
        
        this.parent.innerHTML = "" ;
        this.ul = document.createElement('ul') ;
        this.parent.appendChild(this.ul) ;

        let li_base = document.querySelector(".litemplate") ;
        
        struct.forEach(( function( item, idx ) {
            let li = li_base.cloneNode(true);
            li.setAttribute("data-index",idx) ;
            
            let l = li.querySelector("label") ;
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
                        
                    item.choices.forEach( function(c) {
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
                        
                    item.choices.forEach( function(c) {
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
                    var vdate  = "" ;
                    var vtime  = "" ;
                    if ( item.name in doc ) { 
                        var d = new Date( doc[item.name] ) ;
                        // date
                        try {
                            vdate = this.YYYYMMDDfromDate( d ) ;
                            vtime = this.AMfrom24( d.getHours(), d.getMinutes() ) ;
                        }
                        catch( err ) {
                            vdate = "" ;
                            vtime = "" ;
                        }
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
                    
                    l.appendChild(id) ;
                    l.appendChild(it) ;
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
            
            this.ul.appendChild( li ) ;
        }).bind(this));
        [...document.getElementsByClassName("edit_note")].forEach( (e) => {
            e.disabled = false ;
        }) ;
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
        [...document.getElementsByClassName('returndata')].forEach( (e) => {
            e.disabled = !bool ;
        });
    }
        

    clickEdit() {
        this.ButtonStatus( false ) ;
        this.ul.querySelectorAll("li").forEach(( function(li) {
            let idx = li.getAttribute("data-index") ;
            switch ( this.struct[idx].type ) {
                case "radio":
                    document.getElementsByName(this.struct[idx].name).forEach( function (i) {
                        i.disabled = false ;
                    }) ;
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
        }).bind(this)) ;
        [...document.getElementsByClassName("edit_note")].forEach( (e) => {
            e.disabled = true ;
        }) ;
    }
    
    loadDocData() {
        this.ul.querySelectorAll("li").forEach(( function(li) {
            let idx = li.getAttribute("data-index") ;
            let v = "" ;
            switch ( this.struct[idx].type ) {
                case "radio":
                    document.getElementsByName(this.struct[idx].name).forEach( function (i) {
                        if ( i.checked == true ) {
                            v = i.value ;
                        }
                    }) ;
                    break ;
                case "datetime":
                case "datetime-local":
                    var i = li.querySelectorAll("input") ;
                    try {
                        var d =  this.YYYYMMDDtoDate( i[0].value ) ; // date
                        
                        try {
                            var t = this.AMto24( i[1].value ) ; // time
                            d.setHours( t.hr ) ;
                            d.setMinutes( t.min ) ;
                        } catch( err ) {
                        }
                        // convert to local time
                        v = d.toISOString() ;
                    }
                    catch( err ) {
                        v = "" ;
                    }
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
            this.doc[this.struct[idx].name] = v ;
        }).bind(this)) ;
    }
    
    savePatientData() {
        this.loadDocData() ;
        db.put(this.doc)
        .catch( function( err ) {
            console.log(err) ;
        }).finally ( function() {
            displayStateChange() ;
        });
    }
}

class OperationData extends PatientData {
    savePatientData() {
        this.loadDocData() ;
        db.put(this.doc)
        .then( function(doc) {
            selectOperation( doc.id ) ;
        }).catch( function( err ) {
            console.log(err) ;
        }).finally ( function() {
            displayStateChange() ;
        });
    }
}

class SettingData extends PatientData {
    savePatientData() {
        this.loadDocData() ;
        userName = this.doc["User Name"] ;
        if ( userName != this.doc.userName ) {
            // username changed
            LocalRec = new Local( this.doc.userName ) ;
            LocalRec.init()
            .then(( function() {
                return LocalRec.setDoc( this.doc ) ;
            }).bind(this))
            .then( () => {
                showMainMenu() ;
                window.location.reload(false) ;
            })
            .catch( (err) => {
                console.log(err) ;
            }) ;
        } else {
            LocalRec.setDoc( this.doc )
            .then( () => {
                showMainMenu() ;
                window.location.reload(false) ;
            })
            .catch( (err) => {
                console.log(err) ;
            }) ;
        }
    }
}

class NewPatientData extends PatientData {
    constructor( doc, struct ) {
        super( doc, struct ) ;
        this.clickEdit() ;
    }
    
    savePatientData() {
        this.loadDocData() ;
        if ( this.doc.FirstName == "" ) {
            alert("Need a First Name") ;
        } else if ( this.doc.LastName == "" ) {
            alert("Need a Last Name") ;
        } else if ( this.doc.DOB == "" ) {
            alert("Enter some Date Of Birth") ;
        } else {
            this.doc._id = makePatientId( this.doc ) ;
            db.put( this.doc )
            .then( (doc) => {
                console.log(doc) ;
                selectPatient() ;
                showPatientPhoto() ;
            }).catch( (err) => {
                console.log(err) ;
                alert(err) ;
            }) ;
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
        console.log("Local for ",user, this.id, this.doc ) ;
    }
    
    init() {
        return this._read() ;
    }

    setValue( key, val ) {
        console.log("SET VALUE",key,val);
        this._read()
        .then((function(doc) {
                if ( this.doc[key] != val ) {
                    this.doc[key] = val ;
                    this._write() ;
                }
        }).bind(this)) ;
    }
    
    getValue( key ) {
        this._read()
        .then((function(doc) {
            return this.doc[key] ;
        }).bind(this)) ;
    }
    
    delValue( key ) {
        delete this.doc[key] ;
    }
    
    setDoc( doc ) {
        Object.entries(doc).forEach(( function( k,v ) {
            this.doc[k] = v ;
        }).bind(this)) ;
        return this._write() ;
    }
        
    getDoc() {
        return this.doc ;
    }

    _read() {
        console.log("localread",this.doc,this.id);
        if ( this.readIn ) {
            console.log("PROMISE");
            return Promise.resolve(this.doc) ;
        }
        console.log("POST PROMISE");
        return db.get( this.id )
        .then(( function(doc) {
            console.log("successful read",this.id, doc);
            this.doc = doc ;
            this.readIn = true ;
        }).bind(this))
        .catch(( function(err) {
            console.log("No local record (yet)") ;
            return this._write() ;
        }).bind(this)) ;
    }
    
    _write() {
        console.log("localwrite",this.doc);
        return db.put(this.doc)
        .then(( function(response) {
            this.doc._rev = response.rev ;
        }).bind(this))
        .catch(( (err) => {
            console.log(err) ;
        }).bind(this));
    }
}
   
function UserNameInput() {
    const un = document.getElementById("UserNameText");
    if ( un.value && un.value.length > 0 ) {
        LocalRec = new Local( un.value ) ;
        console.log("LocalRec",LocalRec);
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
        showPatientList() ;
    } else {
        showUserName() ;
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
    
    leave(showFunction) {
        this.is_active = false ;
        this.buttonsdisabled(false) ;
        showFunction() ;
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
        this.leave() ;
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

class Cbar extends Tbar {
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
                .then(( function(doc) {
                    doc.text = this.working.textDiv.innerText ;
                    doc.patient_id = patientId ;
                    if ( this.working.upload == null ) {
                    } else if ( this.working.upload === "remove") {
                        deleteImageFromDoc( doc ) ;
                    } else {
                        putImageInDoc( doc, this.working.upload.type, this.working.upload ) ;
                    }
                    return db.put( doc ) ;
                }).bind(this)).catch( function(err) {
                }).finally(( function() {
                    this.leave() ;
                }).bind(this)) ;
            } else {
                // new note
                let doc = {
                    _id: makeNoteId(),
                    author: userName,
                    text: this.working.textDiv.innerText,
                    patient_id: patientId,
                } ;
                if (this.working.upload && this.working.upload !== "remove") {
                    putImageInDoc( doc, this.working.upload.type, this.working.upload ) ;
                }                
                db.put(doc).catch( function(err) {
                    console.log(err) ;
                }).finally(( function () {
                    this.leave() ;
                }).bind(this)) ;
            }
        }
    }

    leave() {
        super.leave(showNoteList) ;
    }
}
    
var editBar = new Cbar() ;        

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
                db.get(patientId)
                .then(( function(doc) {
                    if ( this.working.upload == null ) {
                    } else if ( this.working.upload === "remove") {
                        deleteImageFromDoc( doc ) ;
                    } else {
                        putImageInDoc( doc, this.working.upload.type, this.working.upload ) ;
                    }
                    return db.put( doc ) ;
                }).bind(this)).catch( function(err) {
                    console.log(err) ;
                }).finally(( function() {
                    this.leave() ;
                }).bind(this)) ;
            }unselectPatient
        }
    }
    
    leave() {
        super.leave(showPatientPhoto) ;
    }
}
    
var photoBar = new Pbar() ;        

function showUserName() {
    displayState = "UserName" ;
    displayStateChange() ;
}

function showMainMenu() {
    displayState = "MainMenu" ;
    displayStateChange() ;
}

function showSettingMenu() {
    displayState = "SettingMenu" ;
    displayStateChange() ;
}

function showPatientList() {
    displayState = "PatientList" ;
    displayStateChange() ;
}

function showPatientDemographics() {
    displayState = "PatientDemographics" ;
    displayStateChange() ;
}
    
function showPatientMedical() {
    displayState = "PatientMedical" ;
    displayStateChange() ;
}

function showOperationList() {
    displayState = "OperationList" ;
    displayStateChange() ;
}
    
function showPatientNew() {
    displayState = "PatientNew" ;
    displayStateChange() ;
}

function showInvalidPatient() {
    displayState = "InvalidPatient" ;
    displayStateChange() ;
}
    
function showPatientPhoto() {
    displayState = "PatientPhoto" ;
    displayStateChange() ;
}

function showNoteList() {
    displayState = "NoteList" ;
    displayStateChange() ;
}

function showNoteNew() {
    displayState = "NoteNew" ;
    displayStateChange() ;
}

function showOperationNew() {
    unselectOperation() ;
    displayState = "OperationEdit" ;
    displayStateChange() ;
}

function showOperationEdit() {
    displayState = "OperationEdit" ;
    displayStateChange() ;
}

function shoeNoteImage() {
    displayState = "NoteImage" ;
    displayStateChange() ;
}

function selectPatient( pid ) {
    if ( patientId != pid ) {
        // change patient -- notes dont apply
        unselectNote() ;
    }
        
    patientId = pid ;
    // Check patient existence
    db.get(patientId)
    .then( function (doc) {
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
        let spl = splitPatientId() ;
        document.getElementById( "titlebox" ).innerHTML = "Name: <B>"+spl.last+"</B>, <B>"+spl.first+"</B>  DOB: <B>"+spl.dob+"</B>" ;
    }).catch( function(err) {
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
    .then( function (doc) {
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
    }).catch( function(err) {
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

function displayStateChange() {
    Array.from(document.getElementsByClassName("pageOverlay")).forEach( (v)=> {
        v.style.display = v.classList.contains(displayState) ? "block" : "none" ;
    });

    console.log("displayStateChange",displayState,LocalRec);
    console.trace();
    if ( LocalRec ) {
        LocalRec.setValue("displayState",displayState) ;
    }

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
            let objectPatientTable = new PatientTable( ["LastName", "FirstName", "DOB","Dx","Procedure" ] ) ;
            getPatients(true)
            .then( function(docs) {
                objectPatientTable.fill(docs.rows) ;
                if ( patientId ) {
                    selectPatient( patientId ) ;
                } else {
                    unselectPatient() ;
                }
            }).catch( function(err) {
                console.log(err);
            });
            break ;
            
        case "OperationList":
            let objectOperationTable = new OperationTable( [ "Procedure", "Surgeon", "Status", "Schedule", "Duration", "Equipment" ]  ) ;
            getOperations(true)
            .then( function(docs) {
                console.log("ops",docs);
                objectOperationTable.fill(docs.rows) ;
            }).catch( function(err) {
                    console.log(err);
            });
            break ;
            
        case "OperationEdit":
            if ( patientId ) {
                if ( operationId ) {
                    db.get( operationId )
                    .then( function(doc) {
                        objectPatientData = new OperationData( doc, structOperation ) ;
                    }).catch( function(err) {
                        console.log(err) ;
                        showInvalidPatient() ;
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
                showPatientList() ;
            }
            break ;
            
        case "PatientNew":
            unselectPatient() ;
            objectPatientData = new NewPatientData( { author: userName, }, structNewPatient ) ;
            break ;
            
        case "PatientPhoto":
            if ( patientId ) {
                let srch = {
                    include_docs: true ,
                    binary: true ,
                    attachments: true ,
                } ;

                db.get( patientId, srch )
                .then( function(doc) {
                    PatientPhoto( doc ) ;
                }).catch( function(err) {
                    console.log(err) ;
                    showInvalidPatient() ;
                }) ;
            } else {
                showPatientList() ;
            }
            break ;
            
        case "PatientDemographics":
            if ( patientId ) {
                db.get( patientId )
                .then( function(doc) {
                    objectPatientData = new PatientData( doc, structDemographics ) ;
                }).catch( function(err) {
                    console.log(err) ;
                    showInvalidPatient() ;
                }) ;
            } else {
                showPatientList() ;
            }
            break ;
            
        case "PatientMedical":
            if ( patientId ) {
                db.get( patientId )
                .then( function(doc) {
                    objectPatientData = new PatientData( doc, structMedical ) ;
                }).catch( function(err) {
                    console.log(err) ;
                    showInvalidPatient() ;
                }) ;
            } else {
                showPatientList() ;
            }
            break ;
            
        case "InvalidPatient":
            unselectPatient() ;
            break ;

        case "NoteList":            
            if ( patientId ) {
                db.get( patientId )
                .then( function(doc) {
                    objectNoteList = new NoteList( NoteListContent ) ;
                }).catch( function(err) {
                    console.log(err) ;
                    showInvalidPatient() ;
                }) ;
            } else {
                showPatientList() ;
            }
            break ;
            
         case "NoteNew":
            if ( patientId ) {
                // New note only
                unselectNote() ;
                NoteNew() ;
            } else {
                showPatientList() ;
            }
            break ;
            
       case "NoteImage":
            if ( patientId ) {
                NoteImage() ;
            } else {
                showPatientList() ;
            }
            break ;
            
        default:
            showPatientList() ;
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
        rowsArray.some( function(r) {
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
                compare = function(rowA, rowB) {
                    return (rowA.cells[colNum].innerText - rowB.cells[colNum].innerText) * dir;
                };
                break;
            case 'string':
                compare = function(rowA, rowB) {
                    return rowA.cells[colNum].innerText > rowB.cells[colNum].innerText ? dir : -dir;
                };
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
        collist.forEach( function(v,i,a) {
            row.insertCell(i).outerHTML='<th>'+v+'</th>' ;
        } );

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
        doclist.forEach( function(doc) {
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
                showPatientPhoto() ;
            }) ;
            collist.forEach( function(colname,i) {
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

class OperationTable extends SortTable {
    constructor( collist ) {
        let tbl = document.getElementById("OperationsList") ;
        tbl.innerHTML = "" ;
          
        // Table Head
        let header = tbl.createTHead() ;
        let row = header.insertRow(0);
        row.classList.add('head') ;
        collist.forEach( function(v,i,a) {
            row.insertCell(i).outerHTML='<th>'+v+'</th>' ;
        } );

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
        doclist.forEach( function(doc) {
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
                showOperationEdit() ;
            }) ;
            collist.forEach( function(colname,i) {
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

function makePatientId(doc, position=null) {
    switch (position) {
        case "first":
            return [ 
                RecordFormat.type.patient,
                RecordFormat.version,
                "!",
                "",
                "", 
                ].join(";") ;
            break ;
        case "last":
            return [ 
                RecordFormat.type.patient,
                RecordFormat.version,
                "\\fff0",
                "",
                "", 
                ].join(";") ;
            break ;
        default:
            d = new Date().toISOString() ;
            break;
    }

    return [ 
        RecordFormat.type.patient,
        RecordFormat.version,
        doc.LastName,
        doc.FirstName,
        doc.DOB, 
        ].join(";") ;
}

function splitPatientId( pid = patientId ) {
    if ( pid ) {
        var spl = pid.split(";") ;
        if ( spl.length !== 5 ) {
            return null ;
        }
        return {
            "type": spl[0],
            "version": spl[1],
            "last" : spl[2],
            "first": spl[3],
            "dob": spl[4],
        } ;
    }
    return null ;
}

function makeNoteId(position=null) {
    let d ;
    switch (position) {
        case "first":
            d = "" ;
            break ;
        case "last":
            d = "\\fff0" ;
            break ;
        default:
            d = new Date().toISOString() ;
            break;
    }
    let spl = splitPatientId() ;
    
    return [ 
        RecordFormat.type.note,
        RecordFormat.version,
        spl.last,
        doc.first,
        doc.dob,
        d , 
        ].join(";") ;
}

function makeOperationId(position=null) {
    let d ;
    switch (position) {
        case "first":
            d = "" ;
            break ;
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

function splitNoteId() {
    if ( noteId ) {
        var spl = noteId.split(";") ;
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

function splitOperationId() {
    if ( operationId ) {
        var spl = operationId.split(";") ;
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
    let indexdoc ;
    if ( patientId ) {        
        db.get(patientId)
        .then( function(doc) {
            indexdoc = doc ;
            return getNotes(false) ;
        }).then( function(docs) {
            let c = "Delete patient \n   " + indexdoc.FirstName + " " + indexdoc.LastName + "\n    " ;
            if (docs.rows.length == 0 ) {
                c += "(no associated notes on this patient) \n   " ;
            } else {
                c += "also delete "+docs.rows.length+" associated notes\n   " ;
            }
            c += "Are you sure?" ;
            if ( confirm(c) ) {
                return docs ;
            } else {
                throw "No delete" ;
            }           
        }).then( function(docs) {
            return Promise.all(docs.rows.map( function (doc) {
                return db.remove(doc.id,doc.value.rev) ;
            })) ;
        }).then( function() {
            return db.remove(indexdoc) ;
        }).then( function() {
            unselectPatient() ;
            showPatientList() ;
        }).catch( function(err) {
            console.log(err) ;
        });
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
    shoeNoteImage() ;  
}

function deleteNote() {
    if ( noteId ) {
        db.get( noteId )
        .then( function(doc) {
            let spl = splitNoteId() ;
            if ( confirm("Delete note on patient" + spl.first + " " + spl.last + " from " +  + spl.date + ".\n -- Are you sure?") ) {
                return doc ;
            } else {
                throw "No delete" ;
            }           
        }).then( function(doc) { 
            return db.remove(doc) ;
        }).then( function() {
            unselectNote() ;
        }).catch( function(err) {
            console.log(err) ;
        }).finally( function () {
            showNoteList() ;
        }) ;
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
    if ( doc ) {
        let d = doc ;
        if ( "doc" in doc ) {
            d = doc.doc ;
        }
        return d._id.split(';').pop()+"  by <b>"+(d.author||"anonymous")+"</b>" ;
    }
    return "New note" ;
}

function getPatients(attachments) {
    doc = {
        startkey: makePatientId(null,"first"),
        endkey: makePatientId(null,"last"),
    } ;
    if (attachments) {
        doc.include_docs = true ;
        doc.binary = true ;
        doc.attachments = true ;
    }

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
    }

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

class NoteList {
    constructor( parent ) {
        if ( parent == null ) {
            parent = document.body ;
        }
        let uls = parent.getElementsByTagName('ul') ;
        if (uls.length > 0 ) { // get rid of old
            parent.removeChild(uls[0]) ;
        }

        this.ul = document.createElement('ul') ;
        this.ul.setAttribute( "id", "NoteList" ) ;
        parent.appendChild(this.ul) ;

        // get notes
        getNotes(true)
        .then(( function(docs) {
            docs.rows.forEach(( function(note, i) {

                let li1 = this.liLabel(note) ;
                this.ul.appendChild( li1 ) ;
                let li2 = this.liNote(note,li1) ;
                this.ul.appendChild( li2 ) ;

            }).bind(this)) ;
            this.li = this.ul.getElementsByTagName('li')
                
        }).bind(this)
        ).catch( function(err) {
            console.log(err) ;
        }); 
    }

    liLabel( note ) {
        let li = document.createElement("li") ;
        li.setAttribute("data-id", note.id ) ;

        li.appendChild( document.getElementById("templates").getElementsByClassName("edit_note")[0].cloneNode(true) );

        let cdiv = document.createElement("div");
        cdiv.innerHTML = noteTitle(note) ;
        cdiv.classList.add("inly") ;
        li.appendChild(cdiv) ;
        li.addEventListener( 'click', (e) => {
            selectNote( note.id ) ;
        }) ;

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
            selectNote( note.id ) ;
            editBar.startedit( li ) ;
        } ;
        label.addEventListener( 'dblclick', (e) => {
            editBar.startedit( li ) ;
        }) ;

        return li ;
    }

}

function getImageFromDoc( doc ) {
    console.log("getImageFrmDoc",doc);
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
    document.getElementById("NoteNewLabel").innerHTML = noteTitle(null)  ;
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
    .then( function(doc) {
        showNoteList() ;
    }).catch( function(err) {
        console.log(err) ;
        showNoteList() ;
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
    .then( function(doc) {
        console.log(doc) ;
        showNoteList() ;
    }).catch( function(err) {
        console.log(err) ;
        showNoteList() ;
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
        return showInvalidPatient() ;
    }
    var card = document.getElementById("printCard") ;
    var t = card.getElementsByTagName("table") ;
    db.get( patientId , { 
        include_docs: true ,
        attachments: true, 
        binary: true, } 
        )
    .then( function(doc) {
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
        catch(err) {
            photo.src = "style/NoPhoto.png" ;
            console.log("No image",doc) ;
        }
        console.log(photo) ;
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
    .then( function(docs) {
        var oleng = docs.rows.length ;
        console.log("rows",oleng);
        if ( oleng > 0 ) {
            console.log("ops",docs);
            t[0].rows[2].cells[1].innerText = docs.rows[oleng-1].doc.Procedure ;
            t[0].rows[3].cells[1].innerText = docs.rows[oleng-1].doc.Duration + " hr" ;
            t[0].rows[4].cells[1].innerText = docs.rows[oleng-1].doc.Surgeon ;
            t[1].rows[5].cells[1].innerText = docs.rows[oleng-1].doc.Equipment ;
        }
        window.print() ;
        show_screen( true ) ;
        displayStateChange() ;
    }).catch( function(err) {
        console.log(err) ;
        showInvalidPatient() ;
    });
}

function parseQuery() {
    s = window.location.search ;
    if ( s.length < 1 ) {
        return null ;
    }
    r = {} ;
    s.substring(1).split("&").forEach( function(q) {
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
    }).on('change', function(change) {
        switch (displayState) {
            case "PatientList":
            case "OperationList":
            case "PatientPhoto":
                displayStateChange();
                break ;
            default:
                break ;
        }
    });

    // Initialise a sync with the remote server
    function sync() {
        let synctext = document.getElementById("syncstatus") ;
        synctext.value = "syncing..." ;
        db.sync( remoteCouch+"/"+cannonicalDBname , {
            live: true,
            retry: true
        }).on('change', function(info) {
            synctext.value = "changed -- " + info ;
        }).on('paused', function() {
            synctext.value = "pending" ;
        }).on('active', function() {
            synctext.value = "active";
        }).on('denied', function(err) {
            synctext.value = "denied " + err ;
        }).on('complete', function(info) {
            synctext.value = "complete -- " + info ;
        }).on('error', function(err) {
            synctext.value = "Sync status: error "+err ;
        });
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
        showUserName() ;
    } else {
        LocalRec = new Local( userName ) ;
        LocalRec.init()
        .then( (doc) => {
        
            // first try the search field
            let q = parseQuery() ;
            if ( q && ( patientId in q ) ) {
                selectPatient( q.patientId ) ;
                showPatientPhoto() ;
            } else {
                switch ( displayState ) {
                    case "PatientList":
                    case "MainMenu":
                    case "PatientPhoto":
                    case "NoteList":
                    case "OperationList":
                    case "SettingMenu":
                        displayStateChange() ;
                        break;
                    case "OperationEdit":
                        showOperationList() ;
                        break ;
                    case "NoteNew":
                    case "NoteImage":
                        showNoteList() ;
                        break ;
                    case "UserName":
                    case "InvalidPatient":
                        showPatientList() ;
                        break ;
                    case "PatientNew":
                    case "PatientDemographics":
                    case "PatientMedical":
                    default:
                        showPatientPhoto() ;
                        break ;
                }
            }
        });
    }
        
    
})();
