var displayState ;
var patientId ;
var commentId ;
var objectPatientOpen  ;
var objectPatientEdit  ;
var objectCommentList ;
var objectCommentNew ;
var objectCommentImage ;
var userName ;
  
var db = new PouchDB('mdb') ;
console.log(db.adapter); // prints 'idb'
console.log(db); // prints 'idb'
var remoteCouch = 'http://192.168.1.5:5984/mdb';

var DbaseVersion = "v0" ;

var Struct_ID = [
    {
        name: "LastName",
        hint: "Patient's last name",
        type: "text",
    },
    {
        name: "FirstName",
        hint: "Patient's first name",
        type: "text",
    },
    {
        name: "DOB",
        hint: "Patient's date of birth",
        type: "date",
    },
] ;

var Struct_Demographics = [
    {
        name: "Picture",
        hint: "Recent photo of the patient",
        type: "image",
    },
    {
        name: "Sex",
        hint: "Patient gender",
        type: "radio",
        choices: ["?","M","F","X"],
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
        type: "text",
    },
    {
        name: "Contact",
        hint: "Additional contact information (family member, local address,...)",
        type: "text",
    },
] ;
    

var Struct_Medical = [
    {
        name: "Dx",
        hint: "Diagnosis",
        type: "text",
    } , 
    {
        name: "Complaint",
        hint: "Main complaint (patient's view of the problem)",
        type: "text",
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
        type: "text",
    },
    {
        name: "Meds",
        hint: "Medicine and antibiotics",
        type: "text",
    },
] ;

var Struct_Procedure = [
    {
        name: "Procedure",
        hint: "Surgical operation / procedure",
        type: "text",
    },
    {
        name: "Surgeon",
        hint: "Surgeon(s) involved",
        type: "text",
    },
    {
        name: "Length",
        hint: "Length of operation (hours) with prep and cleanup",
        type: "real",
    },
    {
        name: "Equipment",
        hint: "Special equipment",
        type: "text",
    },
    {
        name: "Schedule",
        hint: "Scheduled date and time",
        type: "datetime-local",
    },
] ;

class Tbar {
    constructor() {
        this.is_active = false ;
    }

    active() {
        // in edit mode already?
        return this.is_active ;
    }

    fieldset( existingdiv ) {
        this.existing = {} ;
        this.existing.parent  = existingdiv ;
        this.existing.textDiv = existingdiv.querySelector( ".entryfield_text" ) ;
        this.existing.oldText = "" ;
        this.existing.img     = existingdiv.querySelector( ".entryfield_image" ) ;
        if ( this.existing.textDiv ) {
            this.existing.oldText = this.existing.textDiv.innerText ;
        } else {
            this.existing.textDiv = document.createElement("div") ;
            this.existing.textDiv.classNames = "entryfield_text" ;
            this.existing.oldText = "" ;
        }
        console.log( this.existing.oldText ) ;

        this.working = {} ;
        this.working.parent  = existingdiv ;
        this.working.toolbar = document.getElementById("templates").querySelector(".editToolbar").cloneNode(true) ;
        this.working.newText = this.existing.oldText ;
        this.working.textDiv = document.createElement("div") ;
        this.working.textDiv.innerText = this.existing.oldText ;
        this.working.textDiv.contentEditable = true ;
        this.working.img     = document.createElement("img") ;
        this.working.img.className = "entryfield_image" ;
        this.working.upload = null
    }

    working2existing() {
        let t = this.working.textDiv.innerText ;
        this.existing.textDiv.innerText = t ;
        if ( t && t.length>0 ) {
            this.existing.textDiv.style.visibility = "visible" ;
        }
        
        let i = this.working.img ;
        this.existing.img = i ;
    }
    
    existing2show() {
        this.existing.parent.innerHTML = "" ;
        if ( this.existing.img ) {
            this.existing.img.classList.add("entryfield_image") ;
            this.existing.parent.appendChild( this.existing.img ) ;
        }
        if ( this.existing.textDiv ) {
            this.existing.textDiv.classList.add("entryfield_text") ;
            this.existing.parent.appendChild( this.existing.textDiv ) ;
        }
        this.buttonsdisabled( false ) ;
        this.is_active = false ;
    }        
            

    buttonsdisabled( bool ) {
        for ( let b of document.getElementsByClassName( "libutton" ) ) {
            b.disabled = bool ;
        }
    }

    deleteedit() {
        if (this.deletefunc()) {
            this.existing.oldText = null ;
        }
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
    // for comments
    startedit( existingdiv ) {
        if ( this.active() ) {
            return false ;
        }
        this.is_active = true ;
        if ( commentId ) {
            selectComment(existingdiv.getAttribute("data-id")) ;
            this.buttonsdisabled( true ) ;
            this.deletefunc = deleteComment ;
        } else {
            unselectComment() ;
            this.deletefunc = null ;
        }
        this.fieldset( existingdiv ) ;
        if ( this.existing.textDiv == null ) {
            this.existing.textDiv = document.createElement("div") ;
            this.existing.textDiv.className = "entryfield_text" ;
            this.existing.oldText = "" ;
        }
            
        this.working.toolbar.querySelector(".tbarxpic").disabled = (this.existing.img  == null) ;
        this.working.toolbar.querySelector(".tbardel").style.visibility = (this.deletefunc!=null) ? "visible" : "hidden" ;

        if ( this.existing.img  ) {
            this.working.img.src = this.existing.img .src ;
            this.working.img.style.display = "block" ;
        } else {
            this.working.img.style.display = "none" ;
        }

        this.existing.parent.innerHTML = "" ;

        // elements of the working fields
        this.working.parent.appendChild(this.working.img ) ;
        this.working.parent.appendChild(this.working.toolbar) ;
        this.working.parent.appendChild(this.working.textDiv) ;
        return true ;
    }

    saveedit() {
        if ( this.active() ) {
            if ( commentId ) {
                // existing comment
                db.get(commentId).then(( function(doc) {
                    console.log(doc);
                    console.log(this.working) ;
                    console.log(this.working.textDiv) ;
                    doc.text = this.working.textDiv.innerText ;
                    console.log(doc.text) ;
                    if ( this.working.upload == null ) {
                        console.log(doc.text) ;
                    } else if ( this.working.upload === "remove") {
                        console.log(doc.text) ;
                        deleteImageFromDoc( doc ) ;
                    } else {
                        console.log(doc.text) ;
                        putImageInDoc( doc, this.working.upload.type, this.working.upload ) ;
                    }
                    console.log(doc.text) ;
                    return db.put( doc ) ;
                }).bind(this)).then(( function() {
                    this.working2existing() ;
                }).bind(this)).catch( function(err) {
                    console.log(err) ;
                }).finally(( function() {
                    this.existing2show() ;
                    if ( displayState != "CommentList" ) {
                        showCommentList() ;
                    }
                }).bind(this)) ;
            } else {
                // new comment
                let doc = {
                    _id: makeCommentId(),
                    author: userName,
                    text: this.working.textDiv.innerText,
                } ;
                if (this.working.upload && this.working.upload !== "remove") {
                    putImageInDoc( doc, this.working.upload.type, this.working.upload ) ;
                }                
                db.put(doc).then(( function() {
                    this.working2existing() ;
                }).bind(this)).catch( function(err) {
                    console.log(err);
                }).finally(( function () {
                    this.existing2show() ;
                    if ( displayState != "CommentList" ) {
                        showCommentList() ;
                    }
                }).bind(this)) ;
            }
        }
    }
}

var editBar = new Cbar() ;        

var PatientInfoList = [
    ["LastName","text"],
    ["FirstName","text"],
    ["DOB","date"],
    ["Weight(kg)","number"],
    ["Dx","text"], 
    ["Complaints","text"], 
    ["Procedure","text"],
    ["Length","time"],
    ["Equipment","text"],
    ["Sex","text"],
    ["Meds","text"],
    ["Allergies","text"],
    ["Surgeon","text"],
    ["ASA class","number"],
    ["phone","tel"], 
    ["email","email"], 
    ["address","text"], 
    ["Contact","text"] 
    ] ;

function showPatientList() {
    displayState = "PatientList" ;
    displayStateChange() ;
}

function showPatientEdit() {
    displayState = "PatientEdit" ;
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
    
function showPatientOpen() {
    displayState = "PatientOpen" ;
    if ( patientId ) {
    } else {
        displayState = "PatientList" ;
    }
    displayStateChange() ;
}

function showCommentList() {
    displayState = "CommentList" ;
    displayStateChange() ;
}

function showCommentNew() {
    displayState = "CommentNew" ;
    displayStateChange() ;
}

function showCommentImage() {
    displayState = "CommentImage" ;
    displayStateChange() ;
}

function selectPatient( pid ) {
    if ( patientId != pid ) {
        // change patient -- comments dont apply
        unselectComment() ;
    }
        
    patientId = pid ;
    setCookie( "patientId", pid ) ;
    if ( displayState == "PatientList" ) {
        // highlight the list row
        let rows = document.getElementById("PatientTable").rows ;
        for ( let i = 0 ; i < rows.length ; ++i ) {
            if ( rows[i].getAttribute("data-id") == pid ) {
                rows[i].classList.add('choice') ;
            } else {
                rows[i].classList.remove('choice') ;
            }
        }
    }
    document.getElementById("editreviewpatient").disabled = false ;
}



function unselectPatient() {
    patientId = undefined ;
    deleteCookie( "patientId" ) ;
    unselectComment() ;
    if ( displayState == "PatientList" ) {
        let rows = document.getElementById("PatientTable").rows ;
        for ( let i = 0 ; i < rows.length ; ++i ) {
            rows[i].classList.remove('choice') ;
        }
    }
    document.getElementById("editreviewpatient").disabled = true ;
}

function displayStateChange() {
    Array.from(document.getElementsByClassName("pageOverlay")).forEach( (v)=> {
        v.style.display = v.classList.contains(displayState) ? "block" : "none" ;
    });

    setCookie("displayState",displayState) ;

    objectPatientOpen = null ;
    objectPatientEdit = null ;
    objectCommentList = null ;
    objectCommentImage= null ;

    switch( displayState ) {
        case "PatientList":            
            db.allDocs({include_docs: true, descending: true}).then( function(docs) {
                objectPatientList.fill(docs.rows) ;
                if ( patientId ) {
                    selectPatient( patientId ) ;
                } else {
                    unselectPatient() ;
                }
            }).catch( function(err) {
                    console.log(err);
            });
            break ;
            
        case "PatientOpen":
            if ( patientId ) {
                db.get( patientId ).then( function(doc) {
                    objectPatientOpen = new PatientOpen( doc ) ;
                }).catch( function(err) {
                    console.log(err) ;
                    showInvalidPatient() ;
                }) ;
            } else {
                showPatientList() ;
            }
            break ;
            
        case "PatientNew":
            newPatient() ;
            break ;
            
        case "PatientEdit":            
            if ( patientId ) {
                db.get( patientId ).then( function(doc) {
                    objectPatientEdit = new PatientEdit( doc ) ;
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

        case "CommentList":            
            if ( patientId ) {
                db.get( patientId ).then( function(doc) {
                    objectCommentList = new CommentList( CommentListContent ) ;
                }).catch( function(err) {
                    console.log(err) ;
                    showInvalidPatient() ;
                }) ;
            } else {
                showPatientList() ;
            }
            break ;
            
         case "CommentNew":
            if ( patientId ) {
                // New comment only
                unselectComment() ;
                CommentNew() ;
            } else {
                showPatientList() ;
            }
            break ;
            
       case "CommentImage":
            if ( patientId ) {
                CommentImage() ;
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
      const cDecoded = decodeURIComponent(document.cookie); //to be careful
      const cArr = cDecoded .split('; ');
      let res ;
      cArr.forEach(val => {
          if (val.indexOf(name) === 0) res = val.substring(name.length);
      })
      return res;
}

function isAndroid() {
    return navigator.userAgent.toLowerCase().indexOf("android") > -1 ;
}

class sortTable {
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

    delete () {
        this.tname.parentNode.removeChild(this.tname) ;
    } 
}

class dataTable extends sortTable {
    constructor( idname, parent, collist ) {
        if ( parent == null ) {
            parent = document.body ;
        }
          
        let tbl = document.createElement('table') ;
        tbl.setAttribute( "id", idname ) ;

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
        parent.appendChild(tbl) ;
        super(tbl) ;
        this.collist = collist ;

        }

    fill( doclist ) {
        // typically called with doc.rows from allDocs
        let tbody = this.tname.querySelector('tbody') ;
        tbody.innerHTML = "" ;
        let collist = this.collist ;
        doclist.forEach( function(doc) {
            //console.log(doc);
            if (doc.id.split(";").length < 5 ) {
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
                    showPatientOpen() ;
                }) ;
                collist.forEach( function(colname,i) {
                    let c = row.insertCell(i) ;
                    if ( colname in record ) {
                        c.innerText = record[colname] ;
                    } else {
                        c.innerText = "" ;
                    }
                }) ;
            }
        });
    }
  
}

var objectPatientList = new dataTable( "PatientTable", PatientListContent, ["LastName", "FirstName", "DOB","Dx","Procedure" ] ) ;

class FieldList {
    constructor( idname, parent, fieldlist ) {
        if ( parent == null ) {
            parent = document.body ;
        }
        this.fieldlist = fieldlist ;

        let uls = parent.getElementsByTagName('ul') ;
        if (uls.length > 0 ) {
            parent.removeChild(uls[0]) ;
        }

        let ul = document.createElement('ul') ;
        ul.setAttribute( "id", idname ) ;
        for ( let i=0; i<this.fieldlist.length; ++i ) {
            let li = document.createElement("li") ;
            li.appendChild(document.createTextNode(this.fieldlist[i][0])) ;
            ul.appendChild(li) ;

            li = document.createElement("li") ;
            ul.appendChild(li)
        }
        this.ul = ul ;
        parent.appendChild(ul) ;
        this.li = this.ul.getElementsByTagName('li')
    }

    nonnullstring(s) {
        if (s == "" ) {
            return '\u200B' ;
        }
        return s ;
    }
}
  
class PatientOpen extends FieldList {
    constructor( doc ) {
        super( "PatientOpen", PatientOpenContent, PatientInfoList ) ;
        this.ul.addEventListener( 'dblclick', (e) => {
            showPatientEdit() ;
        }) ;

        for ( let i=0; i < this.fieldlist.length; ++i ) {
            this.li[2*i+1].appendChild(document.createTextNode(this.nonnullstring(doc[this.fieldlist[i][0]]))) ;
        }
    }
}

class PatientEdit extends FieldList {
    constructor( doc ) {
        super( "PatientEdit", PatientEditContent, PatientInfoList ) ;
        document.getElementById("saveeditpatient").disabled = true ;
        for ( let i=0; i<this.fieldlist.length; ++i ) {
            let inp = document.createElement("input") ;
            inp.type = this.fieldlist[i][1] ;
            this.li[2*i+1].appendChild(inp) ;
        }

        this.doc = doc ;
        for ( let i=0; i<this.fieldlist.length; ++i ) {
            let contain = this.li[2*i+1].querySelector('input') ;
            let field = this.fieldlist[i][0] ;
            if ( field in this.doc ) {
                contain.value = this.doc[field] ;
            } else {
                contain.value = "" ;
            }
            if ( ["LastName","FirstName","DOB"].indexOf(this.fieldlist[i][0]) >= 0 ) {
                contain.readOnly = true ;
            }
        }
        
        this.ul.addEventListener( 'input', (e) => {
            document.getElementById("saveeditpatient").disabled = false ;
            }) ;
    }
    
    fields2doc() {
        // load fields from form into doc
        for ( let i=0; i<this.fieldlist.length; ++i ) {
            this.doc[this.fieldlist[i][0]] =  this.li[2*i+1].querySelector('input').value ;
        }
    }
    
    
    add() {
        // save changes on a patient
        this.fields2doc() ;
        db.put(this.doc).then( function(d) {
            showPatientOpen() ;
        }).catch( function(err) {
            console.log(err) ;
        }) ;
    }
}

function makePatientId(doc) {
    return [ DbaseVersion, this.doc.LastName, this.doc.FirstName, this.doc.DOB ].join(";") ;
}

function splitPatientId() {
    if ( patientId ) {
        var spl = patientId.split(";") ;
        if ( spl.length !== 4 ) {
            return null ;
        }
        return {
            "version": spl[0],
            "last" : spl[1],
            "first": spl[2],
            "dob": spl[3],
        } ;
    }
    return null ;
}

function checkNew() {
    document.getElementById("addPatient").disabled =
        ( document.getElementById("newLast").value == "" ) || 
        ( document.getElementById("newFirst").value == "" ) || 
        ( document.getElementById("newDOB").value == "" ) ;
} 

function newPatient() {
    unselectPatient() ;
    document.getElementById("newLast").value = "" ; 
    document.getElementById("newFirst").value = "" ; 
    document.getElementById("newDOB").value = "" ;
    checkNew() ;
}

function addPatient() {
    doc = {
        FirstName: document.getElementById("newFirst").value,
        LastName: document.getElementById("newLast").value,
        DOB: document.getElementById("newDOB").value,
    } ;
    doc._id = makePatientId(doc) ;

    db.put( doc ).then( function( d ) {
        selectPatient( doc._id ) ;
        showPatientEdit() ;
    }).catch( function(e) {
        console.log(e) ;
        showPatientList() ;
    });
}

function savePatient() {
    objectPatientEdit.add() ;
}
  
 function deletePatient() {
    let indexdoc ;
    if ( patientId ) {        
        db.get(patientId).then( function(doc) {
            indexdoc = doc ;
            return plusComments(false) ;
        }).then( function(docs) {
            let c = "Delete patient \n   " + indexdoc.FirstName + " " + indexdoc.LastName + "\n    " ;
            if (docs.rows.length == 0 ) {
                c += "(no comment records on this patient) \n   " ;
            } else {
                c += "also delete "+docs.rows.length+" comment records\n   " ;
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

function newImage() {
    console.log("new image");
    unselectComment() ;
    showCommentImage() ;  
}

function deleteComment() {
    if ( commentId ) {
        db.get( commentId ).then( function(doc) {
            if ( confirm("Delete comment on patient" + commentId.split(';')[2] + " " + commentId.split(';')[1] + " " +  + commentId.split(';')[4] + ".\n -- Are you sure?") ) {
                return doc ;
            } else {
                throw "No delete" ;
            }           
        }).then( function(doc) { 
            return db.remove(doc) ;
        }).then( function() {
            unselectComment() ;
            showCommentList() ;
        }).catch( function(err) {
            console.log(err) ;
            return false ;
        });
    }
    return true ;
}    
    
function selectComment( cid ) {
    commentId = cid ;
    setCookie( "commentId", cid ) ;
    if ( displayState == "CommentList" ) {
        // highlight the list row
        let li = document.getElementById("CommentList").getElementsByTagName("LI");
        if ( li && (li.length > 0) ) {
            for ( let l of li ) {
                if ( l.getAttribute("data-id") == commentId ) {
                    l.classList.add('choice') ;
                } else {
                    l.classList.remove('choice') ;
                }
            }
        }
    }
}

function unselectComment() {
    commentId = undefined ;
    deleteCookie( "commentId" ) ;
    if ( displayState == "CommentList" ) {
        let li = document.getElementById("CommentList").li ;
        if ( li && (li.length > 0) ) {
            for ( let l of li ) {
                l.classList.remove('choice') ;
            }
        }
    }
}


function commentTitle( doc ) {
    if ( doc ) {
        let d = doc ;
        if ( "doc" in doc ) {
            d = doc.doc ;
        }
        return d._id.split(';').pop()+"  by <b>"+(d.author||"anonymous")+"</b>" ;
    }
    return "New comment" ;
}

function plusComments(attachments) {
    let skey = [ patientId, "Comment" ].join(";") ;
    doc = {
        startkey: skey,
        endkey: skey+'\\fff0'
    }
    if (attachments) {
        doc.include_docs = true ;
        doc.binary = true ;
        doc.attachments = true ;
    }
    return db.allDocs(doc) ;
}


class CommentList {
    constructor( parent ) {
        if ( parent == null ) {
            parent = document.body ;
        }
        let uls = parent.getElementsByTagName('ul') ;
        if (uls.length > 0 ) { // get rid of old
            parent.removeChild(uls[0]) ;
        }

        let ul = document.createElement('ul') ;
        ul.setAttribute( "id", "CommentList" ) ;

        ul.appendChild( this.lifirst() ) ;

        ul.appendChild( this.lisecond() ) ;

        this.ul = ul ;
        parent.appendChild(ul) ;

        // get comments
        let skey = [ patientId, "Comment" ].join(";") ;
        console.log(skey);
        console.log(skey+'\\fff0');
        
        plusComments(true).then(( function(docs) {
            console.log(docs);
            docs.rows.forEach(( function(comment, i) {

                let li1 = this.liLabel(comment) ;
                this.ul.appendChild( li1 ) ;
                let li2 = this.liComment(comment,li1) ;
                this.ul.appendChild( li2 ) ;

            }).bind(this)) ;
            this.li = this.ul.getElementsByTagName('li')
                
        }).bind(this)
        ).catch( function(err) {
            console.log(err) ;
        }); 
    }

    lifirst() {
        let li = document.createElement("li") ;
        li.appendChild( document.createTextNode("Notes and Comments")) ;
        return li ;
    }

    lisecond() {
        let li = document.createElement("li") ;

        let id = patientId.split(';');
        let pdiv = document.createElement("div");
        pdiv.innerHTML = "Patient: <b>"+id[1]+", "+id[2]+"</b>   DOB: "+id[3] ;
        li.appendChild(pdiv) ;
        return li ;
    }

    liLabel( comment ) {
        let li = document.createElement("li") ;
        li.setAttribute("data-id", comment.id ) ;

        li.appendChild( document.getElementById("templates").getElementsByClassName("editthecomment")[0].cloneNode(true) );

        let cdiv = document.createElement("div");
        cdiv.innerHTML = commentTitle(comment) ;
        cdiv.className = "inly" ;
        li.appendChild(cdiv) ;
        li.addEventListener( 'click', (e) => {
            selectComment( comment.id ) ;
        }) ;

        return li ;
    }

    liComment( comment, label ) {
        let li = document.createElement("li") ;
        li.setAttribute("data-id", comment.id ) ;
        if ( commentId == comment.id ) {
            li.classList.add("choice") ;
        }
        if ( "doc" in comment ) {
            let imagedata = getImageFromDoc( comment.doc ) ;
            if ( imagedata ){
                let img = document.createElement("img") ;
                img.className = "entryfield_image" ;
                img.src = imagedata ;
                li.appendChild(img);
            }

            let textdiv = document.createElement("div") ;
            textdiv.innerText = ("text" in comment.doc) ? comment.doc.text : "" ;
            li.addEventListener( 'dblclick', (e) => {
                editBar.startedit( li ) ;
            }) ;
            textdiv.className = "entryfield_text" ;
            li.appendChild(textdiv);
        }    
        
        li.addEventListener( 'click', (e) => {
            selectComment( comment.id ) ;
        }) ;
        label.getElementsByClassName("editthecomment")[0].onclick =
            (e) => {
            selectComment( comment.id ) ;
            editBar.startedit( li ) ;
        } ;
        label.addEventListener( 'dblclick', (e) => {
            editBar.startedit( li ) ;
        }) ;

        return li ;
    }

}

function getImageFromDoc( doc ) {
    if ("_attachments" in doc ){
        return URL.createObjectURL(doc._attachments.image.data) ;
    }
    return null ;
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

function makeCommentId() {
    let d = new Date().toISOString() ;
    return [ patientId, "Comment" , d ].join(";") ;
}

function CommentNew() {
    console.log(document.getElementById("CommentNewLabel")) ;
    document.getElementById("CommentNewLabel").innerHTML = commentTitle(null)  ;
    console.log("new comment") ;
    let d = document.getElementById("CommentNewText") ;
    d.innerHTML = "" ;
    editBar.startedit( d ) ;
}

function commentCancel() {
    editBar.existing2show() ;
    if ( displayState != "CommentList" ) {
        showCommentList() ;
    }
}

function CommentImage() {
    let inp = document.getElementById("imageInput") ;
    if ( isAndroid() ) {
        inp.removeAttribute("capture") ;
    } else {
        inp.setAttribute("capture","environment");
    }
    console.log("commentimage");
}

function quickImage() {
    document.getElementById("imageQ").click() ;
}

function quickImage2() {
    const files = document.getElementById('imageQ') ;
    const image = files.files[0] ;

    let doc = {
        _id: makeCommentId(),
        text: "",
        author: userName,
    } ;
    putImageInDoc( doc, image.type, image ) ;

    db.put( doc ).then( function(doc) {
        showCommentList() ;
    }).catch( function(err) {
        console.log(err) ;
        showCommentList() ;
    }) ;
}

function getImage() {
    let inp = document.getElementById("imageInput") ;
    inp.click() ;
    console.log("CLICKED");
}
    
   
//let urlObject;
function handleImage() {
    const files = document.getElementById('imageInput')
    const image = files.files[0];

    // change display
    document.getElementsByClassName("CommentImage")[0].style.display = "none" ;
    document.getElementsByClassName("CommentImage2")[0].style.display = "block" ;

     // see https://www.geeksforgeeks.org/html-dom-createobjecturl-method/
    document.getElementById('imageCheck').src = URL.createObjectURL(image) ;
}    

function saveImage() {
    const files = document.getElementById('imageInput')
    const image = files.files[0];
    const text = document.getElementById("annotation").innerText ;

    let doc = {
        _id: makeCommentId(),
        text: text.value,
        author: userName,
    } ;
    putImageInDoc( doc, image.type, image ) ;

    db.put( doc ).then( function(doc) {
        console.log(doc) ;
        showCommentList() ;
    }).catch( function(err) {
        console.log(err) ;
        showCommentList() ;
    }) ;
    document.getElementById('imageCheck').src = "" ;
}

function setUserButton() {
    if ( userName ) {
        document.getElementById("userbutton").innerText = "User: "+userName ;
    } else {    
        document.getElementById("userbutton").innerText = "User?" ;
    }
}

function setUser() {
    let un = prompt( "User name:",userName ) ;
    if ( un ) {
        userName = un ;
        setCookie( "userName", un ) ;
        setUserButton() ;
    }
}

userName = getCookie( "userName" ) ;
setUserButton() ;
          

function setRemoteButton() {
    if ( remoteCouch ) {
        document.getElementById("remotebutton").innerText = "Remote CouchDB: "+remoteCouch ;
    } else {    
        document.getElementById("remotebutton").innerText = "Remote CouchDB: http://host:5984" ;
    }
}

function showScreen( bool ) {
    Array.from(document.getElementsByClassName("screen")).forEach( (v)=> {
        v.style.display = bool ? "block" : "none" ;
    });
    Array.from(document.getElementsByClassName("print_class")).forEach( (v)=> {
        v.style.display = bool ? "none" : "block" ;
    });
}    

function printCard() {
    if ( patientId == null ) {
        return showInvalidPatient() ;
    }
    db.get( patientId ). then( function(doc) {
        showScreen( false ) ;
        var card = document.getElementById("printCard") ;
        var link = window.location.href + "?patientId=" + encodeURIComponent(patientId) ;
        var qr = new QR(
            card.querySelector(".qrCard"),
            link,
            200,200,
            4) ;
        window.print() ;
        showScreen( true ) ;
        displayStateChange() ;
    }).catch( function(err) {
        console.log(err) ;
        showInvalidPatient() ;
    });
}

function setRemote() {
    let un = prompt( "Remote CouchDB address:", remoteCouch ) ;
    let rem = remoteCouch ;
    if ( un ) {

        setCookie( "remoteCouch", un ) ;
        setRemoteButton() ;
        // start page over with new remote
        window.location.reload(false) ;
    }
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
    sindow.location.search = "" ;
    return r ;
};

remoteCouch = getCookie( "remoteCouch" ) ;
setRemoteButton() ;

// Pouchdb routines
(function() {

    'use strict';

    db.changes({
        since: 'now',
        live: true
    }).on('change', function(change) {
        switch (displayState) {
            case "PatientList":
            case "PatientOpen":
            case "CommentList":
                displayStateChange();
                break ;
            case "PatientEdit":
            case "CommentNew":
                break ;
        }
    });

    // Initialise a sync with the remote server
    function sync() {
        let synctext = document.getElementById("syncstatus") ;
        synctext.innerText = "Sync status: syncing..." ;
        console.log(remoteCouch+'/mdb') ;
        db.sync( remoteCouch+'/mdb', {
            live: true,
            retry: true
        }).on('change', function(info) {
            synctext.innerText = "Sync status: changed";
        }).on('paused', function(err) {
            synctext.innerText = "Sync status: paused";
        }).on('active', function() {
            synctext.innerText = "Sync status: active";
        }).on('denied', function(err) {
            synctext.innerText = "Sync status: denied "+err;
        }).on('complete', function(info) {
            synctext.innerText = "Sync status: complete";
        }).on('error', function(err) {
            synctext.innerText = "Sync status: error "+err ;
        });
    }

    if (remoteCouch) {
        sync();
    }

    // Initial start
    showScreen(true) ;
    
    // first try the search field
    let q = parseQuery() ;
    if (q) {
        if ( patientId in q ) {
            selectPatient( q.patientId ) ;
            showPatientOpen() ;
        }
    }
    
    // No search, use cookies
    patientId = getCookie( "patientId" ) ;
    if ( patientId ) {
        selectPatient( patientId ) ;
    }
    displayState = getCookie( "displayState" ) ;
    displayStateChange() ;
    
})();

  
