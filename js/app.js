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

function tbarFunc(command) {
    document.execCommand(command, false, null);
}

class Tbar {
    constructor() {
        this.textdiv = null ;
        this.text = null ;
        this.toolbar = document.getElementById("editToolbar") ;
        this.toolbar.parentNode.removeChild(this.toolbar) ;
    }

    active() {
        return this.textdiv ;
    }

    startedit( existingdiv, savefunc, deletefunc ) {
        // false if already exists
        this.comment = false ;
        if ( !this.active() ) {
            this.savefunc = savefunc ;
            this.deletefunc = deletefunc ;
            this.parent = existingdiv ;
            this.toolbar.querySelector("#tbardel").style.visibility = (deletefunc!=null) ? "visible" : "none" ;
            this.text = this.parent.innerText || "" ;

            this.parent.innerHTML = "" ;
            this.parent.appendChild(this.toolbar) ;

            this.textdiv = document.createElement("div") ;
            this.textdiv.innerText = this.text ;
            this.textdiv.contentEditable = true ;
            this.textdiv.id = "textdiv" ;
            this.parent.appendChild(this.textdiv) ;

            this.toolbar = null ;
            return true ;
        }
        return false ;
    }

    startcommentedit( existingdiv ) {
        this.comment = true ;
        if ( this.active() ) {
            return false ;
        }
        if ( commentId ) {
            selectComment(existingdiv.getAttribute("data-id")) ;
            let li = document.getElementById("CommentList").getElementsByClassName("libutton");
            for ( let l of li ) {
                l.disabled = true ;
            }
            this.deletefunc = deleteComment ;
        } else {
            unselectComment() ;
            this.deletefunc = null ;
        }
        this.parent = existingdiv ;
        this.img = this.parent.querySelector( ".fullimage" ) ;
        this.ctext = this.parent.querySelector( ".commenttext" ) ;
        if ( this.ctext ) {
            this.text = this.ctext.innerText || "" ;
        } else {
            this.ctext = document.createElement("div") ;
            this.ctext.className = "commenttext" ;
            this.text = "" ;
        }
            
        this.toolbar.querySelector("#tbarxpic").disabled = (this.img == null) ;
        this.toolbar.querySelector("#tbardel").style.visibility = (this.deletefunc!=null) ? "visible" : "none" ;

        this.imageslot = document.createElement("img") ;
        this.imageslot.className = "fullimage" ;
        this.file0 = null ;
        if ( this.img ) {
            this.imageslot.src = this.img.src ;
        } else {
            this.imageslot.style.visibility = "none" ;
        }

        this.parent.innerHTML = "" ;

        this.textdiv = document.createElement("div") ;
        this.textdiv.innerText = this.text ;
        this.textdiv.contentEditable = true ;
        this.textdiv.id = "textdiv" ;

        this.parent.appendChild( this.imageslot ) ;
        this.parent.appendChild(this.toolbar) ;
        this.parent.appendChild(this.textdiv) ;

        this.toolbar = null ;
        return true ;
    }

    saveedit() {
        if ( this.active() ) {
            this.text = this.textdiv.innerText ;
            console.log(this.text);
            this.img = this.imageslot ;
            this.canceledit() ;
            if ( this.comment ) {
                saveComment( this.text, this.file0 ) ;
            } else {
                this.savefunc( this.text ) ;
            }
        }
    }

    canceledit() {
        if ( this.active() ) {
            this.toolbar = document.getElementById("editToolbar") ;
            this.parent.innerHTML = ""
            this.textdiv = null ;
        }
        if ( this.comment ) {
            let li = document.getElementById("CommentList").getElementsByClassName("libutton");
            for ( let l of li ) {
                l.disabled = false ;
            }
            if ( this.img ) {
                this.parent.appendChild( this.img ) ;
            }
            this.ctext.innerText = this.text ;
            this.parent.appendChild( this.ctext ) ;
        } else {
            this.parent.innerText = this.text ;
        }
    }

    deleteedit() {
        let t = document.getElementById("editToolbar") ;
        if (this.deletefunc()) {
            this.toolbar = t ;
            this.textdiv = null
            this.text = null ;
        }
    }

    getImage() {
        document.getElementById("imageBar").click() ;
    }

    handleImage() {
        const files = document.getElementById('imageBar')
        this.file0 = files.files[0];
        this.imageslot.src = URL.createObjectURL(this.file0) ;
        this.imageslot.style.visibility = "visible" ;
        document.getElementById("tbarxpic").disabled = false ;
    }

    removeImage() {
        this.imageslot.style.visibility = "none" ;
        this.file0 = "remove" ;
        document.getElementById("tbarxpic").disabled = true ;
    }
}

var editBar = new Tbar() ;        

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
    const dslist = [
        [ "PatientList", "patientListDiv" ] ,
        [ "PatientEdit", "patientEditDiv" ] ,
        [ "PatientOpen", "patientOpenDiv" ] ,
        [ "CommentList", "commentListDiv" ] ,
        [ "CommentNew", "commentNewDiv" ] ,
        [ "CommentImage","commentImageDiv"] ,
        [ "CommentImage2","commentImage2Div"] ,
    ] ;
    for (let ds of dslist) {
        if ( displayState == ds[0] ) {
            document.getElementById(ds[1]).style.display = "block" ;
        } else {
            document.getElementById(ds[1]).style.display = "none" ;
        }
    }

    setCookie("displayState",displayState) ;
    objectPatientOpen = null ;
    objectPatientEdit = null ;
    objectCommentList = null ;
    objectCommentImage= null ;

    switch( displayState ) {
        case "PatientList":            
            db.allDocs({include_docs: true, descending: true}).then( function(docs) {
                //console.log(docs) ;
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
                objectPatientOpen = new OpenPList( "PatientOpen", patientOpenSection ) ;
            } else {
                showPatientList() ;
            }
            break ;
            
        case "PatientEdit":            
            objectPatientEdit = new EditPList( "PatientEdit", patientEditSection ) ;
            break ;
            
        case "CommentList":            
            if ( patientId ) {
                objectCommentList = new CommentList( commentListSection ) ;
            } else {
                showPatientList() ;
            }
            break ;
            
         case "CommentNew":
            if ( patientId ) {
                // New comment only
                unselectComment() ;
                commentNew() ;
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
    document.cookie = cname + "=" + value + "; " + expires + "; path=/";
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
                    console.log("select by click");
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

var objectPatientList = new dataTable( "PatientTable", patientListSection, ["LastName", "FirstName", "DOB","Dx","Procedure" ] ) ;

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
  
class OpenPList extends FieldList {
    constructor( idname, parent ) {
        super( idname, parent, PatientInfoList ) ;
        this.ul.addEventListener( 'dblclick', (e) => {
            showPatientEdit() ;
        }) ;

        db.get( patientId ).then(( function(doc) {
            for ( let i=0; i < this.fieldlist.length; ++i ) {
                this.li[2*i+1].appendChild(document.createTextNode(this.nonnullstring(doc[this.fieldlist[i][0]]))) ;
            }
        }).bind(this)
        ).catch(( function(err) {
            console.log(err) ;
            for ( let i=0; i < this.fieldlist.length; ++i ) {
                this.li[2*i+1].appendChild(document.createTextNode(this.nonnullstring(''))) ;
            }
            }).bind(this)
        );
    }
}

class EditPList extends FieldList {
    constructor( idname, parent ) {
        super( idname, parent, PatientInfoList ) ;
        document.getElementById("saveeditpatient").disabled = true ;
        for ( let i=0; i<this.fieldlist.length; ++i ) {
            let inp = document.createElement("input") ;
            inp.type = this.fieldlist[i][1] ;
            this.li[2*i+1].appendChild(inp) ;
        }

        this.doc = { "_id": "" } ;
        if ( patientId ) {
            db.get( patientId ).then(
            ( function(doc) {
                this.doc = doc ;
            }).bind(this)
            ).then(( function() {
                for ( let i=0; i<this.fieldlist.length; ++i ) {
                    let contain = this.li[2*i+1].querySelector('input') ;
                    let field = this.fieldlist[i][0] ;
                    if ( field in this.doc ) {
                        contain.value = this.doc[field] ;
                    } else {
                        contain.value = "" ;
                    }
                }
            }).bind(this)
            ).catch( function(err) {
                // no matching record
                console.log(err);
            });
        }
        
        this.ul.addEventListener( 'input', (e) => {
            document.getElementById("saveeditpatient").disabled = false ;
            }) ;
    }
    
    tolist() {
        for ( let i=0; i<this.fieldlist.length; ++i ) {
            this.doc[this.fieldlist[i][0]] =  this.li[2*i+1].querySelector('input').value ;
        }
    }
    
    toId() {
        this.doc._id = [ DbaseVersion, this.doc.LastName, this.doc.FirstName, this.doc.DOB ].join(";") ;
    }
    
    add() {
        this.tolist() ;
        if ( this.doc._id == "" ) {
            this.toId() ;
        }
        selectPatient( this.doc._id ) ;
        db.put(this.doc).then( function(d) {
            showPatientOpen() ;
        }).catch( function(err) {
            console.log(err) ;
        }) ;
    }
}

function newPatient() {
    unselectPatient() ;
    showPatientEdit() ;  
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
        li.appendChild( document.getElementById("commentbuttons").getElementsByClassName("createthecomment")[0].cloneNode(true) ) ;
        li.appendChild( document.getElementById("commentbuttons").getElementsByClassName("createtheimage")[0].cloneNode(true) ) ;
        li.appendChild( document.createTextNode("Notes and Comments")) ;
        li.appendChild( document.getElementById("commentbuttons").getElementsByClassName("returnfromcomment")[0].cloneNode(true) ) ;
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

        li.appendChild( document.getElementById("commentbuttons").getElementsByClassName("editthecomment")[0].cloneNode(true) );

        let cdiv = document.createElement("div");
        cdiv.innerHTML = commentTitle(comment) ;
        li.appendChild(cdiv) ;

        return li ;
    }

    liComment( comment, label ) {
        let li = document.createElement("li") ;
        li.setAttribute("data-id", comment.id ) ;
        if ( commentId == comment.id ) {
            li.classList.add("choice") ;
        }
        if ( "doc" in comment ) {

            if ("_attachments" in comment.doc ){
                let img = document.createElement("img") ;
                img.className = "fullimage" ;
                img.src = URL.createObjectURL(comment.doc._attachments.image.data) ;
                li.appendChild(img);
            }

            let textdiv = document.createElement("div") ;
            textdiv.innerText = ("text" in comment.doc) ? comment.doc.text : "" ;
            li.addEventListener( 'dblclick', (e) => {
                editBar.startcommentedit( li ) ;
            }) ;
            textdiv.className = "commenttext" ;
            li.appendChild(textdiv);
        }    
        
        li.addEventListener( 'click', (e) => {
            selectComment( comment.id ) ;
        }) ;
        label.getElementsByClassName("editthecomment")[0].onclick =
            (e) => {
            editBar.startcommentedit( li ) ;
        } ;

        return li ;
    }

}

function makeCommentId() {
    let d = new Date().toISOString() ;
    return [ patientId, "Comment" , d ].join(";") ;
}

function commentNew() {
    console.log(document.getElementById("commentNewLabel")) ;
    document.getElementById("commentNewLabel").innerHTML = commentTitle(null)  ;
    console.log("new comment") ;
    let d = document.getElementById("commentNewField") ;
    d.innerHTML = "" ;
    editBar.startcommentedit( d ) ;
}

function commentCancel() {
    editBar.canceledit() ;
    if ( displayState != "CommentList" ) {
        showCommentList() ;
    }
}

function saveComment( plaintext, file0 ) {
    console.log("saveComment") ;
    console.log(plaintext) ;
    console.log(typeof plaintext) ;
    console.log(file0) ;
    if ( commentId ) {
        // existing comment
        db.get(commentId).then( function(doc) {
            doc.text = plaintext ;
            if ( file0 === "remove") {
                if ( "_attachments" in doc ) {
                    console.log(doc);
                    delete doc["_attachments"] ;
                    console.log(doc);
                }
            } else if (file0 ) {
                doc._attachments = {
                    image: {
                        content_type: file0.type,
                        data: file0,
                    }
                }
            }
            db.put( doc ) ;
        }).then( x => {
            showCommentList() ;
        }).catch( err => {
            console.log(err) ;
            showCommentList() ;
        });
    } else {
        // new comment
        let doc = {
            _id: makeCommentId(),
            author: userName,
            text: plaintext,
        } ;
        if (file0 && file0 !== "remove") {
            doc._attachments = {
                image: {
                    content_type: file0.type,
                    data: file0,
                }
            }
        }                
        db.put(doc).then( x => {
            showCommentList() ;
        }).catch( err => {
            console.log(err);
            showCommentList() ;
        });
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

    db.put( {
        _id: makeCommentId(),
        text: "",
        author: userName,
        _attachments: {
            image: {
                content_type: image.type,
                data: image,
            }
        }
    }).then( function(doc) {
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
    console.log(files.length);
    const image = files.files[0];


//    if (urlObject) {
//        URL.revokeObjectURL(urlObject) // only required if you do that multiple times
//        urlObject = null ;
//    }

    // change display
    document.getElementById("commentImageDiv").style.display = "none" ;
    document.getElementById("commentImage2Div").style.display = "block" ;

    //urlObject = URL.createObjectURL(new Blob([arrayBuffer]));
//    urlObject = URL.createObjectURL(image);

//    document.getElementById('imageCheck').src = urlObject;
    document.getElementById('imageCheck').src = URL.createObjectURL(image) ;
     // see https://www.geeksforgeeks.org/html-dom-createobjecturl-method/
}    

function saveImage() {
    const files = document.getElementById('imageInput')
    const image = files.files[0];
    const text = document.getElementById("annotation").innerText ;

    db.put( {
        _id: makeCommentId(),
        text: text.value,
        author: userName,
        _attachments: {
            image: {
                content_type: image.type,
                data: image,
            }
        }
    }).then( function(doc) {
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
    displayState = getCookie( "displayState" ) ;
    displayStateChange() ;
    patientId = getCookie( "patientId" ) ;
    if ( patientId ) {
        selectPatient( patientId ) ;
    }
    

})();

  
