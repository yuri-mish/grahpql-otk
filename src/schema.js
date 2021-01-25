const _ = require("lodash");
const moment = require("moment");
const fetch = require("node-fetch");

const { GraphQLJSON, GraphQLJSONObject } = require("graphql-type-json");
//const GraphQLDecimal =require('graphql-type-decimal');
const Authors = require("./data/authors");
const Posts = require("./data/posts");

const Users = require("./data/users");

const { PubSub } = require('graphql-subscriptions')
const pubsub = new PubSub();

let {
  GraphQLString,
  GraphQLList,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLSchema,
  GraphQLFloat,
  GraphQLFieldMap,
  GraphQLInt,
  GraphQLScalarType,
  GraphQLInputObjectType,
  GraphQLBoolean,
} = require("graphql");

const {
  getRefObj,
  createQuery,
  createQueryTabular,
  createQueryCat,docSync,catSync
} = require("./schFunk");
//const { errorName } = require("../constants");
const { Cookie } = require("express-session");


const PartnerType = new GraphQLObjectType({
  name: "Partner",
  description: "This represent Partner",
  extensions: {
    otk: {
      keyF: "ref",
      tbl: "cat",
      class_name: "cat.partners",
    },
  },
  fields: () => {
    //const {getRefObj} = require('./schFunk');
    return {
      _id: { type: GraphQLString },
      ref: {
        type: GraphQLString,
        resolve: (obj) => {
          _ref = getRefObj(obj);
          return _ref ? _ref : null;
        },
      },
      name: { type: GraphQLString },
      edrpou: { type: GraphQLString },
      totalcount:{ type: GraphQLInt },

//      name: { type: GraphQLString },
//      edrpou: { type: GraphQLString },
      id: { type: GraphQLString },
      parent:{ type: GraphQLString },
      is_buyer:{type: GraphQLBoolean},
      is_supplier:{type: GraphQLBoolean},
      legal_address:{ type: GraphQLString },
      partner_details:{ type: GraphQLString },
      individual_legal:{ type: GraphQLString },
      inn:{ type: GraphQLString },
      note:{type: GraphQLString},
      name_full:{type: GraphQLString},

    };
  },
});
const UserType = new GraphQLObjectType({
  name: "User",
  description: "This represent User",
  extensions: {
    otk: {
      keyF: "ref",
      tbl: "cat",
      class_name: "cat.users",
    },
  },
  fields: () => {
    //const {getRefObj} = require('./schFunk');
    return {
      _id: { type: GraphQLString },
      ref: {
        type: GraphQLString,
        resolve: (obj) => {
          _ref = getRefObj(obj);
          return _ref ? _ref : null;
        },
      },
      name: { type: GraphQLString },
      id: { type: GraphQLString },
    };
  },
});
const DeprtmentType = new GraphQLObjectType({
  name: "Depatment",
  description: "This represent Department",
  extensions: {
    otk: {
      keyF: "ref",
      tbl: "cat",
      class_name: "cat.branches",
    },
  },
  fields: () => {
    return {
      _id: { type: GraphQLString },
      ref: {
        type: GraphQLString,
        resolve: (obj) => {
          return getRefObj(obj);
        },
      },
      name: { type: GraphQLString },
    };
  },
});

const NomType = new GraphQLObjectType({
  name: "Nom",
  description: "This represent Nomenclature",
  extensions: {
    otk: {
      keyF: "ref",
      tbl: "cat",
      class_name: "cat.nom",
    },
  },
  fields: () => {
    return {
      _id: { type: GraphQLString },
      ref: {
        type: GraphQLString,
        resolve: (obj) => {
          return getRefObj(obj);
        },
      },
      name: { type: GraphQLString },
      name_full: { type: GraphQLString },
      vat_rate: { type: GraphQLString },
      totalcount:{ type: GraphQLInt },

    };
  },
});
const PriceType = new GraphQLObjectType({
  name: "price",
  description: "This represent price",
  fields: () => {
    return {
      nom: { type: GraphQLString },
      price: {type: GraphQLFloat },
      currency: { type: GraphQLString },
      vat_included: {type: GraphQLString },
      }
    }
  });

const OrganizationType = new GraphQLObjectType({
  name: "Organisation",
  description: "This represent Organization",
  extensions: {
    otk: {
      keyF: "ref",
      tbl: "cat",
      class_name: "cat.organizations",
    },
  },
  fields: () => {
    return {
      _id: { type: GraphQLString },
      ref: {
        type: GraphQLString,
        resolve: (obj) => {
          return getRefObj(obj);
        },
      },
      name: { type: GraphQLString },
    };
  },
});

const ServiceLineBuyersOrderType = new GraphQLObjectType({
  name: "ServiceLineBuyerOrder",
  description: "This represent ServiceLineBuyerOrder",
  fields: () => {
    return {
      row: { type: GraphQLInt },
      nom: { type: NomType },
      content: { type: GraphQLString },
      price: { type: GraphQLFloat },
      quantity: { type: GraphQLFloat },
      amount: { type: GraphQLFloat },
      discount_percent: { type: GraphQLFloat },
      discount_percent_automatic: { type: GraphQLFloat },
      gos_code: { type: GraphQLString },
      vin_code: { type: GraphQLString },
      vat_rate: { type: GraphQLString },
      vat_amount: { type: GraphQLFloat },
    };
  },
});

const BuyersOrderType = new GraphQLObjectType({
  name: "BuyersOrder",
  description: "This represent Buyers Order",
  args: {
    ref: {
      type: GraphQLString,
    },
  },
  fields: () => ({
    _id: { type: GraphQLString },
    organization: { type: OrganizationType },
    doc_amount: { type: GraphQLFloat },
    number_doc: { type: GraphQLString },
    date: { type: GraphQLString },
    partner: { type: PartnerType },
    department: { type: DeprtmentType },
    ClientPerson: { type: GraphQLString },
    ClientPersonPhone: { type: GraphQLString },
    responsible:{type:UserType},
    vat_included:{type: GraphQLString},
    note: { type: GraphQLString },
    paid: { type: GraphQLFloat },
    shipped: { type: GraphQLFloat },

    totalcount:{ type: GraphQLInt },
    services: {
      type: new GraphQLList(ServiceLineBuyersOrderType),
      resolve: async (obj, arg, cont, info) => {
        var qq = createQueryTabular(
          obj,
          info,
          "services",
          "buyers_order",
          ServiceLineBuyersOrderType,
          10
        );
        const dbf = require("./db");
        res = await dbf.query(qq, []);
        return res.rows.map((e) => {
          return e.jsb;
        });
      },
    },
  }),
}); 

const AuthorType = new GraphQLObjectType({
  name: "Author",
  description: "This represent an author",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLString) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    twitterHandler: { type: GraphQLString },
  }),
});

const PostType = new GraphQLObjectType({
  name: "s",
  description: "This represent a s",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLString) },
    title: { type: new GraphQLNonNull(GraphQLString) },
    body: { type: GraphQLString },
    category: { type: GraphQLString },
    author: {
      type: AuthorType,
      resolve: function (post) {
        return _.find(Authors, (a) => a.id == post.author_id);
      },
    },
  }),
});

const filtType = new GraphQLInputObjectType({
  name: "filter",
  fields: {
    field: { type: GraphQLString },
    expr: { type: GraphQLString },
    value: { type: GraphQLString },
  },
});

const sortType = new GraphQLInputObjectType({
  name: "sort",
  fields: {
    selector: { type: GraphQLString },
    desc: { type: GraphQLString },
  },
});

const BlogQueryRootType = new GraphQLObjectType({
  name: "BlogAppSchema",
  description: "Blog Application Schema Query Root",
  fields: {
    authors: {
      type: new GraphQLList(AuthorType),
      description: "List of all Authors",
      resolve: function () {
        return Authors;
      },
    },
    posts: {
      type: new GraphQLList(PostType),
      description: "List of all Posts",
      resolve: function () {
        return Posts;
      },
    },
    buyers_orders: {
      name: "buyers_order",
      type: new GraphQLList(BuyersOrderType),
      args: {
        ref: {
          type: GraphQLString,
        },
        limit: {
          type: GraphQLInt,
        },
        offset: {
          type: GraphQLInt,
        },
        lookup: { type: GraphQLString },
        nameContaine: { type: GraphQLString },
        filter: {
          type: new GraphQLList(filtType),
        },
        jfilt: {
          type: new GraphQLList(GraphQLJSON),
        },

        sort: {type: sortType,},
        totalCount: { type: GraphQLInt },
      },
      resolve: async function (par, args, cont, info) {
        console.log("currUser:", cont.currUser);
        console.log('=Args:',args);
        if (!cont.currUser) return new Error("AUTH_ERROR");
        var queryOptions = { 
          currUser: cont.currUser, 
          lookup: args.lookup,
          limit: args.limit?args.limit:undefined,
          totalCount: args.totalCount?args.totalCount:undefined,

        };
        console.log("queryOptions:", queryOptions);
        var qq = createQuery(
          args,
          info,
          "buyers_order",
          BuyersOrderType,
          queryOptions
        );

        const dbf = require("./db");
        res = await dbf.query(qq, []);
        if (!args.totalCount){
          return res.rows.map((e) => {
              return e.jsb;
          });
        }    
        return res.rows
      
      },
    },
    partners: {
      name: "partners",
      type: new GraphQLList(PartnerType),
      args: {
        ref: {
          type: GraphQLString,
        },
        limit: {
          type: GraphQLInt,
        },
        offset: {
          type: GraphQLInt,
        },
        lookup: { type: GraphQLString },
        //nameContaine: { type: GraphQLString },

        filter: {
          type: new GraphQLList(filtType),
        },
        jfilt: {
          type: new GraphQLList(GraphQLJSON), 
        },

        totalCount: { type: GraphQLInt },
        js: { type: GraphQLJSON },
      },
      resolve: async function (par, args, cont, info) {
        
	console.log('===args:',args)
//	console.log('===context:',cont)
	const queryOptions = {
          lookup: args.lookup,
          nameContaine: args.nameContaine,
          limit: args.limit?args.limit:undefined,
          totalCount: args.totalCount?args.totalCount:undefined,
	  rlsLimit: `inner join (select distinct jsb->>'partner' as pref from doc where branch = '${cont.currUser.branch}' and class_name = 'doc.buyers_order') dc on dc.pref=d.ref`
        }
	if(args.jfilt){
	var noRls = false 
	    args.jfilt.forEach((f)=>{
		if (f && f.fld ==='edrpou' && f.val.length > 3 ){
		noRls=true}
	    })
	if (noRls){
		delete queryOptions.rlsLimit 
	    }
	}
       
        var qq = createQueryCat(args, info, "partners", PartnerType, queryOptions);
        const dbf = require("./db");
         console.log('===',qq);
        res = await dbf.query(qq, []);

        if (!args.totalCount){
            return res.rows.map((e) => {
	    
            var retValue = false	
	    if (e.jsb.is_buyer) {
		if (e.jsb.is_buyer === "") retValue = false
		else retValue = e.jsb.is_buyer;    
	    }
	    e.jsb.is_buyer = retValue
	   
	    retValue=false
	    if (e.jsb.is_supplier) {
		if (e.jsb.is_supplier === "") retValue = false
		else retValue = e.jsb.is_supplier;    
	    }
	    e.jsb.is_supplier = retValue

            return e.jsb;
	    
            });
          }    
          return res.rows
        }
    },
    noms: {
      name: "noms",
      type: new GraphQLList(NomType),
      args: {
        ref: {
          type: GraphQLString,
        },
        limit: {
          type: GraphQLInt,
        },
        offset: {
          type: GraphQLInt,
        },
        lookup: { type: GraphQLString },
        nameContaine: { type: GraphQLString },
        name: { type: GraphQLString },
        filter: {
          type: new GraphQLList(filtType),
        },
        skip: { type: GraphQLInt },
        jfilt: {
          type: new GraphQLList(GraphQLJSON),
        },
        js: { type: GraphQLJSON },
        totalCount: { type: GraphQLInt },

      },
      resolve: async function (par, args, cont, info) {
        console.log(args);
        var qq = createQueryCat(args, info, "nom", NomType, {
          lookup: args.lookup,
          nameContaine: args.nameContaine,
          limit: args.limit?args.limit:undefined,
          totalCount: args.totalCount?args.totalCount:undefined,

        });
        const dbf = require("./db");
        console.log(qq);
        res = await dbf.query(qq, []);
        
        if (!args.totalCount){
          return res.rows.map((e) => {
              return e.jsb;
          });
        }   
        return res.rows
        // return res.rows.map((e) => {
        //   return e.jsb;
        // });
      },
    },
    prices: {
      name: "prices",
      type: new GraphQLList(PriceType),
      args: {
        date: {
          type: GraphQLString,
        },
      },
      resolve: async function (par, args, cont, info) {
        console.log('method prices:',args);
        user = cont.currUser
            dateFilt = ` and d.date <= '${args.date}'`

        qq=`with datenom AS(
          select distinct max(d.date) maxdate, pr.value->'nom' nom     from doc d,jsonb_array_elements(d.jsb->'goods') pr  
                          where d.class_name = 'doc.nom_prices_setup' ${dateFilt} and pr.value->>'price_type' = '${user.price_type}'
                          group by ( pr.value->'nom'))
          select datenom.maxdate date, datenom.nom nom, prc.price price, curr.currency currency ,curr.vat_included vat_included  from datenom 
            left join 	(select d.date date, pr->'price' price, pr.value->'nom' nom 
                    from doc d,jsonb_array_elements(d.jsb->'goods') pr 
                    where d.class_name = 'doc.nom_prices_setup' ${dateFilt} and pr.value->>'price_type' = '${user.price_type}' ) prc
            on datenom.maxdate = prc.date and datenom.nom = prc.nom
            left join (select c.jsb->>'price_currency' currency, c.jsb->>'vat_price_included' vat_included  from cat c 
                      where c.class_name='cat.nom_prices_types' and c.ref='${user.price_type}' ) curr              
            on true  `
            
            
        const dbf = require("./db");
        console.log(qq);
        res = await dbf.query(qq, []);
        return res.rows;
      },
    },
    branch: {
      name: "branch",
      type: GraphQLJSONObject,
      args: {
        ref: {
          type: GraphQLString,
        },
      },
      //   limit: {
      //     type: GraphQLInt,
      //   },
      //   offset: {
      //     type: GraphQLInt,
      //   },
      //   lookup: { type: GraphQLString },
      //   nameContaine:{type : GraphQLString},
      //   name: {type: GraphQLString} ,
      //   edrpou: {type: GraphQLString} ,
      //   filter:{
      //     type: new GraphQLList(filtType)
      //       },
      //       skip:{type:GraphQLInt},
      //       js:{type:GraphQLJSON},

      // },
      resolve: async function (par, args, cont, info) {
        //args.ref = cont.currUser.token
        console.log(args);

        var qq = createQueryCat(args, info, "branches", undefined, {
          limit: 1,
        });
        const dbf = require("./db");
        //console.log('pg_query:',qq);
        res = await dbf.query(qq, []);
        //console.log('pg_res:',res);

        if (res.rowCount > 0) return res.rows[0];
        else {
        }
      },
    },
    opendatabot: {
      name: "opendatabot",
      type: GraphQLJSONObject,
      args: {
        kod: {
          type: GraphQLString,
        },
      },
      resolve: async function (par, args, cont, info) {
        console.log(args);
        respError = {error:'Неавторизований'}
	if (!(cont.currUser && cont.currUser.token)) return (respError)
        res = await fetch(
          `https://opendatabot.com/api/v2/fullcompany/${args.kod}?apiKey=egkG5O2foC&edr=true`,
        )
          .then((response) => {
            if (response.ok) {
              return response.json()
            } else {
              return { ok: false };
            }
          }).then((data)=>{
		
		console.log(data)  
		return data
	    })
	return res
      },
    },
    tst: {
      name: "fff",
      type: GraphQLString,
      args: {
        id: {
          type: GraphQLString,
        },
      },
      resolve: async (obj, args) => {
        console.log(obj, args);
        docSync();
        catSync();
        return "this  test 2";
      },
    },

    logout: {
      name: "logout",
      type: GraphQLJSON,
      resolve: async (obj, args, context) => {
    
	if (context.currUser) 
		for (var i = Users.length; i--;)
		     {
			  if (Users[i].token === context.currUser.token) {Users.splice(i, 1);}
		     }

        return {};
      },
    },
    auth: {
      name: "auth",
      type: GraphQLJSON,
      args: {
        name: { type: GraphQLString },
        pass: { type: GraphQLString },
      },
      resolve: async (obj, args, context) => {
        console.log("Auth", obj, args);

        const sendData = {
          name: args.name,
          password: args.pass,
        };
        const POSTrequestOptions = {
          method: "POST",
          mode: "cors",
          cache: "no-cache",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: "",
        };

        POSTrequestOptions.body = JSON.stringify(sendData);

        console.log(Users);

        res = await fetch(
          "https://couch.vioo.com.ua" + "/_session",
          POSTrequestOptions
        )
          .then((response) => {
            if (response.ok) {
              return response.json();
            } else {
              return { ok: false };
            }
          })
          .then(async (data) => {
            if (!data.ok) return data;
            console.log("=login respons=:" + JSON.stringify(data));
            var user = Users.find((obj) => {
              return obj.name === data.name;
            });
            console.log("=user from tale=:", user);
            var branch = "";
            var ref = "";
            var isAdmin = false;
            data.roles.forEach((r) => {
              var opt = r.split(":");
              if (opt[0] === "branch") branch = opt[1];
              else if (opt[0] === "ref") ref = opt[1];
              else if (opt[0] === "_admin") isAdmin = true;
            });

            //context.res.cookie('token', data.token, {httpOnly:false,  'httpOnly': false, SameSite:false,})
            if (!user) {
              token =
                Math.random().toString(36).substring(2, 15) +
                Math.random().toString(36).substring(2, 15) +
                Math.random().toString(36).substring(2, 15) +
                Math.random().toString(36).substring(2, 15);
              data.token = token;

              var qq = `SELECT d.jsb jsb FROM cat d  where d.ref='${branch}' and d.class_name='cat.branches'`
              console.log('branch:',branch)
              const dbf = require("./db");
              
              organizations = ''
              price_type = ''
              var resQ = await dbf.query(qq, []);
                if (resQ.rowCount>0){
                   br_row = resQ.rows[0].jsb
                   organizations = br_row.organizations[0].acl_obj;
                   console.log('organizations:',organizations)
                   br_row.departments[0].acl_obj.extra_fields.forEach((extr)=>{
                     if (extr.property_name === "ТипЦенНоменклатуры")
                      price_type = extr.value
                   }); 
                   console.log('price_type:',price_type)
              }
              

              Users.push({
                ref: ref,
                name: data.name,
                isAdmin: isAdmin,
                branch: branch,
                token: data.token,
                validTo: moment().add(3, "hours"),
                organizations:organizations,
                price_type:price_type

              });
            } else {
              token = user.token;
            }
            context.res.setHeader("Set-Cookie", [
              `token=${token}; Max-age=38600; Path=/`,//;  Path=/; Max-age= 3600;SameSite=Lax;`,
            ]);
            return data;
          })
          .catch((error) => console.log("=Error=:" + error));
          
         

        if (res.ok) return { ok: res.ok, name: res.name, token: res.token };
        else return new Error("AUTH_ERROR");
      },
    },
  },
});

const BlogMutationRootType = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    setBuyersOrder: {
      type: BuyersOrderType,
      args: { 
        input: { 
          type: GraphQLJSONObject
        } 
      },

      resolve: async (source, args,context) => {
        //console.log("Source: ", source, "\n Args: ", args);
        //console.log("currUser:", context.currUser);
        if (!context.currUser) return new Error("AUTH_ERROR");
        const class_name = 'doc.buyers_order'
        var qq = `SELECT d.jsb jsb FROM doc d  where d.id=$1 and d.class_name=$2`
        //console.log('Query:',qq)
        const dbf = require("./db");
        var resQ = await dbf.query(qq, [args.input._id,class_name]);
        var orig_doc = resQ.rows.length>0?resQ.rows[0].jsb:{
              department:context.currUser.branch,
              organization:context.currUser.organizations,
            }
	if (orig_doc.services) delete orig_doc.services
        //+++
        //console.log('ResQ:',resQ )
        var resDoc  = _.merge(orig_doc,args.input)
        //console.log ('resDoc:', JSON.stringify(resDoc))
        
        const couch = dbf.couch.use("otk_2_doc");
        if (resQ.rows.length>0) {
          dbf.query(`UPDATE doc SET jsb=$1, date=$2,class_name=$3,branch=$4 WHERE id=$5 and class_name=$3`, 
          [JSON.stringify(resDoc),
          new Date(resDoc.date),
          class_name,
          context.currUser.branch,
          resDoc._id
          ]);
        }
        else 
        {
          dbf.query(`INSERT INTO doc (id,jsb,date,class_name,branch) VALUES($1,$2,$3,$4,$5)`, 
          [ args.input._id,
            JSON.stringify(resDoc),
          new Date(resDoc.date),
          class_name,
          context.currUser.branch
          ]);
        } 
         
        await couch.insert(resDoc).then((body) => {
          // console.log('=couch response',body)
        }  )
      pubsub.publish('NOTIFICATION_NEW_DOCUMENT', args.input);//+++++
        return {_id:"ok"}
      },
    }, 
    setPartner: {
      type: PartnerType,
      args: { 
        input: { 
          type: GraphQLJSONObject
        } 
      },

      resolve: async (source, args,context) => {
        //console.log("Source: ", source, "\n Args: ", args);
        //console.log("currUser:", context.currUser);
        if (!context.currUser) return new Error("AUTH_ERROR");
        const table = 'cat'
        const class_name = `${table}.partners`
        var qq = `SELECT d.jsb jsb FROM ${table} d  where d.id=$1 and d.class_name=$2`
        //console.log('Query:',qq)
        const dbf = require("./db");
        var resQ = await dbf.query(qq, [args.input._id,class_name]);
        var orig_doc = resQ.rows.length>0?resQ.rows[0].jsb:{
//              department:context.currUser.branch,
//              organization:context.currUser.organizations,
            }
        //+++
        //console.log('ResQ:',resQ )
        var resDoc  = _.merge(orig_doc,args.input)
        //console.log ('resDoc:', JSON.stringify(resDoc))
        
        const couch = dbf.couch.use(`otk_2_ram`);
    console.log('=1=',args.input)
        if (resQ.rows.length>0) {
          dbf.query(`UPDATE ${table} SET jsb=$1 WHERE id=$2`, 
          [JSON.stringify(resDoc),
            resDoc._id
          ]);
        }
        else 
        {
          dbf.query(`INSERT INTO ${table} (id,jsb,class_name,ref) VALUES($1,$2,$3,$4)`, 
          [ args.input._id,
            JSON.stringify(resDoc),
            class_name,
            args.input._id.split("|")[1]
          ]);
        } 
         
        await couch.insert(resDoc).then((body) => {
          // console.log('=couch response',body)
        }  )
      
        return {_id:"ok"}
      },
    }, 
  },
});

const SubscriptionRootType = new GraphQLObjectType({
  name: "Subscription",
  fields: {
    docChange: {
      type: GraphQLJSONObject, //BuyersOrderType, //BuyersOrderType,
      args: { 
        input: { 
          type: GraphQLJSONObject
        } 
      },
      resolve: (source, args,context) => {
	console.log(`subscribed...`)
        return pubsub.asyncIterator('NOTIFICATION_NEW_DOCUMENT')
	}
    }}
})

const BlogAppSchema = new GraphQLSchema({
  query: BlogQueryRootType,
  mutation: BlogMutationRootType,
  subscription:SubscriptionRootType,

});

module.exports = BlogAppSchema;
