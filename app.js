const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
mongoose.set('strictQuery', true);
mongoose.connect("mongodb+srv://admin-naman:test123@cluster0.3divyrr.mongodb.net/todoListDB");
const itemsSchema = {
    name: {type: String, required: true},
    type: {type: String, required: true}
};

const Item = mongoose.model("Item", itemsSchema);
const item1 = new Item({ name: "Go shopping", type: "Personal"});
const item2 = new Item({ name: "Get rich", type: "Personal" });
const item3 = new Item({ name: "Become Powerful in Lords Mobile", type: "Personal"});
const defaultItems = [item1, item2, item3];
const listSchema = {
    name: {type: String, required: true},
    items: [itemsSchema]
};
const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
    Item.find({}, function (err, items) {
        if (err) {
            console.log(err);
        } else if (items.length === 0) {
            
            Item.insertMany(defaultItems, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Pushed the default items");
                }
            });
            res.redirect("/");
        }else {
            res.render("list", { title: "Personal", listItems: items});
        }
    });
})

app.post("/", async function (req, res) {
    let item = req.body.todo;
    let list = req.body.list;
    let newItem = new Item({name: item, type: list});
    await newItem.save();
    if(list === "Personal"){
        res.redirect("/");
    }else{
        if (item !== "") {
            List.findOne({name: list},async function(err, foundList){
                if(err){
                    console.log(err);
                }else{
                    foundList.items.push(newItem);
                    await foundList.save();
                    res.redirect("/" + list);
                }
            })
        } else {
            res.redirect("/" + list);
        }
    }

})

app.get("/:list", async function(req, res){
    const listName = req.params.list;
    List.findOne({name: listName}, async function(err, list){
        if(err){
            console.log(err);
            res.send("Some err occoured idk");
        }else if(list){
            res.render("list", {title: list.name, listItems: list.items});
        }else{
            const newList = new List({
                name: listName,
                items: []
            })
            await newList.save();
            res.redirect("/" + listName);
        }
    })
})

app.get("/about", function (req, res) {
    res.render("about");
})

app.get("/favicon.ico", function(req, res){res.redirect("/")});


app.post("/delete", function(req, res){
    const toDel = req.body.check;
    const listTitle = req.body.listName;
    
    Item.findById(toDel, function(err, item){
        if(item){
            Item.findByIdAndDelete(toDel, function(err){
                if(err){
                    console.log(err);
                    res.send("Some error occoured idk");
                }else{
                    List.findOne({name: listTitle}, function(err, found){
                        found.items.forEach( async element => {
                            if(element.name === item.name){
                                const arr = found.items;
                                arr.splice(arr.findIndex(a => a.name === element.name));
                                await found.save()
                                res.redirect("/" + listTitle);
                            }
                        });
                    })
                    
                }
            })
        }
    })
})

let port = process.env.PORT;
if(port == null || port == ""){
    port = 3000;
}

app.listen(port, function () {
    console.log("Server up and running.");
})
