


# Initialization

## Create the first user

As long as no user exist, the application launches in "open" mode. An unauthenticated request can be used to create the first user : 

```
curl -XPOST -H "Content-Type: application/json" -d '{"username":"<...>", "password":"<...>", "isAdministrator": true}' "http://<hostname>:<port>/api/v1/users"
```

Then restart the application to enable permissions management